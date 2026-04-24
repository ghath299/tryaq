import type { Express, Request } from "express";
import { createServer, type Server } from "node:http";
import {
  medicines,
  pharmacies,
  availabilityByMedicineId,
  chatsByPharmacyId,
  type ChatMessage,
} from "./mockData";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OTPRecord {
  otp: string;
  expiry: number;
  attempts: number; // عدد محاولات التحقق الخاطئة
}

interface RateRecord {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

// ─── Stores (in-memory) ───────────────────────────────────────────────────────
const otpStore = new Map<string, OTPRecord>();

// Rate limiting: key = "ip:phone" أو "ip" أو "phone"
const rateLimitStore = new Map<string, RateRecord>();

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG = {
  OTP_EXPIRY_MS: 5 * 60 * 1000,          // 5 دقائق
  OTP_MAX_ATTEMPTS: 5,                    // 5 محاولات تحقق خاطئة قبل الحظر
  RATE_SEND_MAX: 3,                       // 3 طلبات OTP كحد أقصى
  RATE_SEND_WINDOW_MS: 10 * 60 * 1000,   // خلال 10 دقائق
  RATE_VERIFY_MAX: 5,                     // 5 محاولات تحقق
  RATE_VERIFY_WINDOW_MS: 10 * 60 * 1000, // خلال 10 دقائق
  BLOCK_DURATION_MS: 30 * 60 * 1000,     // حظر 30 دقيقة
  IRAQ_PHONE_REGEX: /^07[3-9]\d{8}$/,    // أرقام عراقية: 07X-XXXXXXXX
  NAME_MIN_WORDS: 3,                      // اسم ثلاثي على الأقل
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0])
      .split(",")[0]
      .trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidIraqiPhone(phone: string): boolean {
  return CONFIG.IRAQ_PHONE_REGEX.test(phone);
}

function isValidName(name: string): boolean {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 1);
  return words.length >= CONFIG.NAME_MIN_WORDS;
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // محظور؟
  if (record?.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfterMs: record.blockedUntil - now };
  }

  if (!record || now - record.firstRequest > windowMs) {
    // نافذة جديدة
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true };
  }

  if (record.count >= max) {
    // تجاوز الحد → حظر
    const blockedUntil = now + CONFIG.BLOCK_DURATION_MS;
    rateLimitStore.set(key, { ...record, blockedUntil });
    return { allowed: false, retryAfterMs: CONFIG.BLOCK_DURATION_MS };
  }

  // زيادة العداد
  rateLimitStore.set(key, { ...record, count: record.count + 1 });
  return { allowed: true };
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[OTP] TELEGRAM credentials missing");
    return;
  }
  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }
  );
  if (!res.ok) {
    console.error("[Telegram] Error:", await res.text());
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export async function registerRoutes(app: Express): Promise<Server> {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // POST /api/auth/send-otp
  // ══════════════════════════════════════════════════════════════════════════════
  app.post("/api/auth/send-otp", async (req, res) => {
    const { phoneNumber, fullName } = req.body as {
      phoneNumber?: string;
      fullName?: string;
    };

    const ip = getClientIP(req);

    // ── 1. التحقق من الحقول ────────────────────────────────────────────────────
    if (!phoneNumber || !fullName) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف والاسم مطلوبان",
      });
    }

    // ── 2. التحقق من صيغة الرقم العراقي ──────────────────────────────────────
    if (!isValidIraqiPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف غير صحيح — يجب أن يكون رقماً عراقياً (07XXXXXXXXX)",
      });
    }

    // ── 3. التحقق من الاسم ────────────────────────────────────────────────────
    if (!isValidName(fullName)) {
      return res.status(400).json({
        success: false,
        message: "الاسم يجب أن يكون ثلاثياً على الأقل",
      });
    }

    // ── 4. Rate limiting بالـ IP ──────────────────────────────────────────────
    const ipCheck = checkRateLimit(
      `send:ip:${ip}`,
      CONFIG.RATE_SEND_MAX,
      CONFIG.RATE_SEND_WINDOW_MS
    );
    if (!ipCheck.allowed) {
      const minutes = Math.ceil((ipCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `تم تجاوز الحد المسموح — حاول بعد ${minutes} دقيقة`,
        retryAfterMs: ipCheck.retryAfterMs,
      });
    }

    // ── 5. Rate limiting بالرقم ───────────────────────────────────────────────
    const phoneCheck = checkRateLimit(
      `send:phone:${phoneNumber}`,
      CONFIG.RATE_SEND_MAX,
      CONFIG.RATE_SEND_WINDOW_MS
    );
    if (!phoneCheck.allowed) {
      const minutes = Math.ceil((phoneCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `تم تجاوز الحد — حاول بعد ${minutes} دقيقة`,
        retryAfterMs: phoneCheck.retryAfterMs,
      });
    }

    // ── 6. توليد OTP وحفظه ────────────────────────────────────────────────────
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      expiry: Date.now() + CONFIG.OTP_EXPIRY_MS,
      attempts: 0,
    });

    // ── 7. إرسال عبر التلكرام ─────────────────────────────────────────────────
    await sendTelegramMessage(
      `🔐 <b>طلب تسجيل دخول</b>\n\n` +
      `👤 الاسم: <b>${fullName}</b>\n` +
      `📱 الرقم: <b>${phoneNumber}</b>\n` +
      `🌐 IP: <code>${ip}</code>\n` +
      `🔑 الرمز: <b>${otp}</b>\n\n` +
      `⏳ صالح لمدة 5 دقائق`
    );

    console.log(`[OTP] Sent to ${phoneNumber} from IP ${ip}`);

    return res.json({ success: true, message: "تم إرسال رمز التحقق" });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // POST /api/auth/verify-otp
  // ══════════════════════════════════════════════════════════════════════════════
  app.post("/api/auth/verify-otp", (req, res) => {
    const { phoneNumber, otp } = req.body as {
      phoneNumber?: string;
      otp?: string;
    };

    const ip = getClientIP(req);

    // ── 1. التحقق من الحقول ────────────────────────────────────────────────────
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف والرمز مطلوبان",
      });
    }

    // ── 2. Rate limiting للتحقق بالـ IP + الرقم ──────────────────────────────
    const ipCheck = checkRateLimit(
      `verify:ip:${ip}`,
      CONFIG.RATE_VERIFY_MAX,
      CONFIG.RATE_VERIFY_WINDOW_MS
    );
    if (!ipCheck.allowed) {
      const minutes = Math.ceil((ipCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `محاولات كثيرة — محظور لمدة ${minutes} دقيقة`,
        retryAfterMs: ipCheck.retryAfterMs,
      });
    }

    const phoneCheck = checkRateLimit(
      `verify:phone:${phoneNumber}`,
      CONFIG.RATE_VERIFY_MAX,
      CONFIG.RATE_VERIFY_WINDOW_MS
    );
    if (!phoneCheck.allowed) {
      const minutes = Math.ceil((phoneCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `محاولات كثيرة — محظور لمدة ${minutes} دقيقة`,
        retryAfterMs: phoneCheck.retryAfterMs,
      });
    }

    // ── 3. التحقق من OTP ──────────────────────────────────────────────────────
    const stored = otpStore.get(phoneNumber);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "لا يوجد رمز مرسل لهذا الرقم — اطلب رمزاً جديداً",
      });
    }

    // انتهت الصلاحية؟
    if (Date.now() > stored.expiry) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: "انتهت صلاحية الرمز — اطلب رمزاً جديداً",
      });
    }

    // تجاوز المحاولات؟
    if (stored.attempts >= CONFIG.OTP_MAX_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return res.status(429).json({
        success: false,
        message: "تجاوزت عدد المحاولات — اطلب رمزاً جديداً",
      });
    }

    // الرمز غلط؟
    if (stored.otp !== otp) {
      // زيادة عداد المحاولات
      otpStore.set(phoneNumber, { ...stored, attempts: stored.attempts + 1 });
      const remaining = CONFIG.OTP_MAX_ATTEMPTS - stored.attempts - 1;
      return res.status(400).json({
        success: false,
        message: `الرمز غير صحيح — تبقى لك ${remaining} محاولة`,
        attemptsRemaining: remaining,
      });
    }

    // ✅ الرمز صحيح — احذفه فوراً
    otpStore.delete(phoneNumber);

    console.log(`[OTP] Verified for ${phoneNumber} from IP ${ip}`);

    return res.json({ success: true, message: "تم التحقق بنجاح" });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // باقي المسارات
  // ══════════════════════════════════════════════════════════════════════════════
  app.get("/api/users/role/:phoneNumber", (req, res) => {
    const { phoneNumber } = req.params;
    const mockRoles: Record<string, string> = {
      "07801111111": "doctor",
      "07802222222": "pharmacist",
    };
    const role = mockRoles[phoneNumber] || "patient";
    res.json({ phoneNumber, role });
  });

  app.post("/api/analyze", (_req, res) => {
    setTimeout(() => {
      res.json({
        name: "Paracetamol",
        confidence: 0.985,
        extractedText: "Panadol Advance 500mg Tablets",
      });
    }, 800);
  });

  app.get("/api/medicines", (req, res) => {
    const query = String(req.query.query || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Math.min(20, Number(req.query.pageSize || 10)));
    const filtered = query
      ? medicines.filter(
          (m) =>
            m.nameAr.toLowerCase().includes(query) ||
            m.nameEn.toLowerCase().includes(query)
        )
      : medicines;
    const start = (page - 1) * pageSize;
    res.json({
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
      hasNextPage: start + pageSize < filtered.length,
    });
  });

  app.get("/api/pharmacies", (req, res) => {
    const governorate = String(req.query.governorate || "").trim().toLowerCase();
    const items = governorate
      ? pharmacies.filter((p) => p.governorate.toLowerCase() === governorate)
      : pharmacies;
    res.json({ items });
  });

  app.get("/api/availability", (req, res) => {
    const medicineId = String(req.query.medicineId || "");
    const governorate = String(req.query.governorate || "").trim().toLowerCase();
    const pharmacyIds = availabilityByMedicineId[medicineId] || [];
    const items = pharmacies.filter(
      (p) =>
        pharmacyIds.includes(p.id) &&
        (!governorate || p.governorate.toLowerCase() === governorate)
    );
    res.json({ items });
  });

  app.get("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const allMessages = [...(chatsByPharmacyId[pharmacyId] || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const limitParam = Number(req.query.limit || 0);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 0;
    const before = req.query.before ? new Date(String(req.query.before)).getTime() : null;
    const filtered = before
      ? allMessages.filter((item) => new Date(item.createdAt).getTime() < before)
      : allMessages;
    if (!limit) return res.json({ items: filtered, hasMore: false, nextBefore: null });
    const items = filtered.slice(-limit);
    return res.json({
      items,
      hasMore: filtered.length > items.length,
      nextBefore: filtered.length > items.length && items[0] ? items[0].createdAt : null,
    });
  });

  app.post("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      text: req.body?.text,
      imageUrl: req.body?.imageUrl,
      sender: "patient",
      createdAt: new Date().toISOString(),
    };
    if (!chatsByPharmacyId[pharmacyId]) chatsByPharmacyId[pharmacyId] = [];
    chatsByPharmacyId[pharmacyId].push(message);
    res.status(201).json({ item: message });
  });

  app.post("/api/uploads/chat-image", (_req, res) => {
    res.status(201).json({
      imageUrl: `https://placehold.co/600x400/png?text=chat+image+${Date.now()}`,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
