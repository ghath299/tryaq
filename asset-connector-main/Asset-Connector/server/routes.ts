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
  attempts: number;
  fullName: string;
  ip: string;
  userAgent: string;
  location?: { lat: number; lng: number; province: string };
}

interface RateRecord {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

// ─── Stores ───────────────────────────────────────────────────────────────────
const otpStore = new Map<string, OTPRecord>();
const rateLimitStore = new Map<string, RateRecord>();

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG = {
  OTP_EXPIRY_MS: 5 * 60 * 1000,
  OTP_MAX_ATTEMPTS: 5,
  RATE_SEND_MAX: 3,
  RATE_SEND_WINDOW_MS: 10 * 60 * 1000,
  RATE_VERIFY_MAX: 5,
  RATE_VERIFY_WINDOW_MS: 10 * 60 * 1000,
  BLOCK_DURATION_MS: 30 * 60 * 1000,
  IRAQ_PHONE_REGEX: /^07[3-9]\d{8}$/,
  NAME_MIN_WORDS: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0])
      .split(",")[0].trim();
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

function parseUserAgent(ua: string): string {
  if (!ua) return "غير معروف";

  let device = "غير معروف";
  let os = "غير معروف";

  // OS
  if (/iPhone/.test(ua)) os = "iOS iPhone";
  else if (/iPad/.test(ua)) os = "iOS iPad";
  else if (/Android/.test(ua)) {
    const match = ua.match(/Android ([0-9.]+)/);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/Windows/.test(ua)) os = "Windows";
  else if (/Macintosh/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  // Device brand
  if (/Samsung/.test(ua)) device = "Samsung";
  else if (/iPhone/.test(ua)) device = "iPhone";
  else if (/Huawei/.test(ua)) device = "Huawei";
  else if (/Xiaomi|MIUI/.test(ua)) device = "Xiaomi";
  else if (/OPPO/.test(ua)) device = "OPPO";
  else if (/vivo/.test(ua)) device = "Vivo";
  else if (/iPad/.test(ua)) device = "iPad";

  return `${device} — ${os}`;
}

function formatIraqTime(): string {
  return new Date().toLocaleString("ar-IQ", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record?.blockedUntil && now < record.blockedUntil) {
    return { allowed: false, retryAfterMs: record.blockedUntil - now };
  }

  if (!record || now - record.firstRequest > windowMs) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true };
  }

  if (record.count >= max) {
    const blockedUntil = now + CONFIG.BLOCK_DURATION_MS;
    rateLimitStore.set(key, { ...record, blockedUntil });
    return { allowed: false, retryAfterMs: CONFIG.BLOCK_DURATION_MS };
  }

  rateLimitStore.set(key, { ...record, count: record.count + 1 });
  return { allowed: true };
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[Telegram] credentials missing");
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
  if (!res.ok) console.error("[Telegram] Error:", await res.text());
}

// ─── إرسال بيانات المستخدم الكاملة للتلكرام ───────────────────────────────────
async function notifyNewUser(data: {
  fullName: string;
  phoneNumber: string;
  ip: string;
  userAgent: string;
  otp: string;
  channel: string;
  location?: { lat: number; lng: number; province: string };
}): Promise<void> {
  const deviceInfo = parseUserAgent(data.userAgent);
  const time = formatIraqTime();
  const mapsLink = data.location
    ? `https://maps.google.com/?q=${data.location.lat},${data.location.lng}`
    : null;

  const locationText = data.location
    ? `📍 <b>الموقع:</b>\n` +
      `   • المحافظة: ${data.location.province}\n` +
      `   • الإحداثيات: ${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}\n` +
      `   • <a href="${mapsLink}">فتح في الخريطة 🗺️</a>`
    : `📍 <b>الموقع:</b> لم يُحدد`;

  const channelEmoji =
    data.channel === "whatsapp" ? "💬 واتساب" :
    data.channel === "sms" ? "📨 SMS" : "✈️ تلكرام";

  const message =
    `🆕 <b>مستخدم جديد يطلب تسجيل دخول!</b>\n\n` +
    `👤 <b>الاسم:</b> ${data.fullName}\n` +
    `📱 <b>الرقم:</b> <code>${data.phoneNumber}</code>\n\n` +
    `${locationText}\n\n` +
    `📲 <b>الجهاز:</b> ${deviceInfo}\n` +
    `🌐 <b>IP:</b> <code>${data.ip}</code>\n` +
    `📡 <b>القناة:</b> ${channelEmoji}\n` +
    `⏰ <b>الوقت:</b> ${time}\n\n` +
    `🔑 <b>رمز OTP:</b> <code>${data.otp}</code>\n` +
    `⏳ صالح لمدة 5 دقائق`;

  await sendTelegramMessage(message);
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
    const {
      phoneNumber,
      fullName,
      channel = "telegram",
      location,
    } = req.body as {
      phoneNumber?: string;
      fullName?: string;
      channel?: string;
      location?: { lat: number; lng: number; province: string };
    };

    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";

    // ── التحقق من الحقول ────────────────────────────────────────────────────
    if (!phoneNumber || !fullName) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف والاسم مطلوبان",
      });
    }

    if (!isValidIraqiPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف غير صحيح — يجب أن يكون رقماً عراقياً (07XXXXXXXXX)",
      });
    }

    if (!isValidName(fullName)) {
      return res.status(400).json({
        success: false,
        message: "الاسم يجب أن يكون ثلاثياً على الأقل",
      });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const ipCheck = checkRateLimit(`send:ip:${ip}`, CONFIG.RATE_SEND_MAX, CONFIG.RATE_SEND_WINDOW_MS);
    if (!ipCheck.allowed) {
      const minutes = Math.ceil((ipCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `تم تجاوز الحد — حاول بعد ${minutes} دقيقة`,
        retryAfterMs: ipCheck.retryAfterMs,
      });
    }

    const phoneCheck = checkRateLimit(`send:phone:${phoneNumber}`, CONFIG.RATE_SEND_MAX, CONFIG.RATE_SEND_WINDOW_MS);
    if (!phoneCheck.allowed) {
      const minutes = Math.ceil((phoneCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `تم تجاوز الحد — حاول بعد ${minutes} دقيقة`,
        retryAfterMs: phoneCheck.retryAfterMs,
      });
    }

    // ── توليد OTP ────────────────────────────────────────────────────────────
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      expiry: Date.now() + CONFIG.OTP_EXPIRY_MS,
      attempts: 0,
      fullName,
      ip,
      userAgent,
      location,
    });

    // ── إرسال بيانات المستخدم للتلكرام ───────────────────────────────────────
    await notifyNewUser({
      fullName,
      phoneNumber,
      ip,
      userAgent,
      otp,
      channel,
      location,
    });

    console.log(`[OTP] Sent to ${phoneNumber} via ${channel} from IP ${ip}`);

    return res.json({ success: true, message: "تم إرسال رمز التحقق" });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // POST /api/auth/verify-otp
  // ══════════════════════════════════════════════════════════════════════════════
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phoneNumber, otp } = req.body as {
      phoneNumber?: string;
      otp?: string;
    };

    const ip = getClientIP(req);

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: "رقم الهاتف والرمز مطلوبان" });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const ipCheck = checkRateLimit(`verify:ip:${ip}`, CONFIG.RATE_VERIFY_MAX, CONFIG.RATE_VERIFY_WINDOW_MS);
    if (!ipCheck.allowed) {
      const minutes = Math.ceil((ipCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `محاولات كثيرة — محظور لمدة ${minutes} دقيقة`,
        retryAfterMs: ipCheck.retryAfterMs,
      });
    }

    const phoneCheck = checkRateLimit(`verify:phone:${phoneNumber}`, CONFIG.RATE_VERIFY_MAX, CONFIG.RATE_VERIFY_WINDOW_MS);
    if (!phoneCheck.allowed) {
      const minutes = Math.ceil((phoneCheck.retryAfterMs || 0) / 60000);
      return res.status(429).json({
        success: false,
        message: `محاولات كثيرة — محظور لمدة ${minutes} دقيقة`,
        retryAfterMs: phoneCheck.retryAfterMs,
      });
    }

    // ── التحقق من OTP ────────────────────────────────────────────────────────
    const stored = otpStore.get(phoneNumber);

    if (!stored) {
      return res.status(400).json({ success: false, message: "لا يوجد رمز مرسل — اطلب رمزاً جديداً" });
    }

    if (Date.now() > stored.expiry) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ success: false, message: "انتهت صلاحية الرمز — اطلب رمزاً جديداً" });
    }

    if (stored.attempts >= CONFIG.OTP_MAX_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return res.status(429).json({ success: false, message: "تجاوزت عدد المحاولات — اطلب رمزاً جديداً" });
    }

    if (stored.otp !== otp) {
      otpStore.set(phoneNumber, { ...stored, attempts: stored.attempts + 1 });
      const remaining = CONFIG.OTP_MAX_ATTEMPTS - stored.attempts - 1;
      return res.status(400).json({
        success: false,
        message: `الرمز غير صحيح — تبقى ${remaining} محاولة`,
        attemptsRemaining: remaining,
      });
    }

    // ✅ OTP صحيح
    otpStore.delete(phoneNumber);

    // إشعار تلكرام بنجاح التسجيل
    await sendTelegramMessage(
      `✅ <b>دخل بنجاح!</b>\n\n` +
      `👤 ${stored.fullName}\n` +
      `📱 <code>${phoneNumber}</code>\n` +
      `🌐 IP: <code>${ip}</code>\n` +
      `⏰ ${formatIraqTime()}`
    );

    console.log(`[OTP] Verified for ${phoneNumber} from IP ${ip}`);

    return res.json({ success: true, message: "تم التحقق بنجاح" });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // GET /api/config/telegram  ← رابط البوت
  // ══════════════════════════════════════════════════════════════════════════════
  app.get("/api/config/telegram", async (_req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.json({ botUrl: null });
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await r.json() as { ok: boolean; result?: { username?: string } };
      if (data.ok && data.result?.username) {
        return res.json({ botUrl: `https://t.me/${data.result.username}` });
      }
    } catch {
      // fallback
    }
    return res.json({ botUrl: null });
  });

  // ── باقي المسارات ─────────────────────────────────────────────────────────────
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
      res.json({ name: "Paracetamol", confidence: 0.985, extractedText: "Panadol Advance 500mg" });
    }, 800);
  });

  app.get("/api/medicines", (req, res) => {
    const query = String(req.query.query || "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Math.min(20, Number(req.query.pageSize || 10)));
    const filtered = query
      ? medicines.filter((m) => m.nameAr.toLowerCase().includes(query) || m.nameEn.toLowerCase().includes(query))
      : medicines;
    const start = (page - 1) * pageSize;
    res.json({ items: filtered.slice(start, start + pageSize), page, pageSize, total: filtered.length, hasNextPage: start + pageSize < filtered.length });
  });

  app.get("/api/pharmacies", (req, res) => {
    const governorate = String(req.query.governorate || "").trim().toLowerCase();
    const items = governorate ? pharmacies.filter((p) => p.governorate.toLowerCase() === governorate) : pharmacies;
    res.json({ items });
  });

  app.get("/api/availability", (req, res) => {
    const medicineId = String(req.query.medicineId || "");
    const governorate = String(req.query.governorate || "").trim().toLowerCase();
    const pharmacyIds = availabilityByMedicineId[medicineId] || [];
    const items = pharmacies.filter((p) => pharmacyIds.includes(p.id) && (!governorate || p.governorate.toLowerCase() === governorate));
    res.json({ items });
  });

  app.get("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const allMessages = [...(chatsByPharmacyId[pharmacyId] || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const limitParam = Number(req.query.limit || 0);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 0;
    const before = req.query.before ? new Date(String(req.query.before)).getTime() : null;
    const filtered = before ? allMessages.filter((item) => new Date(item.createdAt).getTime() < before) : allMessages;
    if (!limit) return res.json({ items: filtered, hasMore: false, nextBefore: null });
    const items = filtered.slice(-limit);
    return res.json({ items, hasMore: filtered.length > items.length, nextBefore: filtered.length > items.length && items[0] ? items[0].createdAt : null });
  });

  app.post("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const message: ChatMessage = { id: `m-${Date.now()}`, text: req.body?.text, imageUrl: req.body?.imageUrl, sender: "patient", createdAt: new Date().toISOString() };
    if (!chatsByPharmacyId[pharmacyId]) chatsByPharmacyId[pharmacyId] = [];
    chatsByPharmacyId[pharmacyId].push(message);
    res.status(201).json({ item: message });
  });

  app.post("/api/uploads/chat-image", (_req, res) => {
    res.status(201).json({ imageUrl: `https://placehold.co/600x400/png?text=chat+image+${Date.now()}` });
  });

  app.post("/api/payment/initiate", async (req, res) => {
    const { provider, walletPhone, cardNumber, cardExpiry, cardCVV, cardName } = req.body;

    try {
      if (provider === "zaincash") {
        // TODO: integrate ZainCash API here
        // https://docs.zaincash.iq
        res.json({ success: true, transactionId: `ZC-${Date.now()}` });
      } else if (provider === "asia") {
        // TODO: integrate Asia Hawala API here
        res.json({ success: true, transactionId: `AS-${Date.now()}` });
      } else if (provider === "card") {
        // TODO: integrate card payment gateway here
        res.json({ success: true, transactionId: `CC-${Date.now()}` });
      } else {
        res.status(400).json({ success: false, message: "Unknown provider" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Payment processing error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
