import type { Express } from "express";
import { createServer, type Server } from "node:http";
import {
  medicines,
  pharmacies,
  availabilityByMedicineId,
  chatsByPharmacyId,
  type ChatMessage,
} from "./mockData";
import { connectDB, getUsersCol, getOtpsCol, getTelegramLinksCol } from "./db";
import { sendTelegramMessage, generateOTP } from "./telegram";

export async function registerRoutes(app: Express): Promise<Server> {
  connectDB().catch((e) => console.error("[MongoDB] Connection error:", e));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept",
    );
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // ─── Telegram Webhook ────────────────────────────────────────────────────
  // Handles /start otp_PHONE deep-link and legacy /link command
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const message = req.body?.message;
      if (!message) return res.sendStatus(200);

      const chatId = String(message.chat?.id);
      const text: string = message.text || "";

      // Deep-link flow: /start otp_07XXXXXXXXX
      if (text.startsWith("/start otp_")) {
        const phone = text.replace("/start otp_", "").trim();
        if (!phone) return res.sendStatus(200);

        const links = await getTelegramLinksCol();
        await links.updateOne(
          { phone },
          { $set: { phone, chatId, linkedAt: new Date() } },
          { upsert: true }
        );

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 60 * 1000);

        const otps = await getOtpsCol();
        await otps.deleteMany({ phone, used: false });
        await otps.insertOne({
          phone,
          code: otp,
          method: "telegram",
          expiresAt,
          used: false,
          createdAt: new Date(),
        });

        await sendTelegramMessage(
          chatId,
          `🔐 رمز التحقق الخاص بك في تِرياق:\n\n<code>${otp}</code>\n\nصالح لمدة 60 ثانية.`
        );

        return res.sendStatus(200);
      }

      // Legacy /link command
      if (text.startsWith("/link")) {
        const phone = text.replace("/link", "").trim().replace(/\s+/g, "");
        if (!phone) {
          await sendTelegramMessage(chatId, "أرسل رقم هاتفك بعد الأمر:\n/link 07XXXXXXXXX");
          return res.sendStatus(200);
        }
        const links = await getTelegramLinksCol();
        await links.updateOne(
          { phone },
          { $set: { phone, chatId, linkedAt: new Date() } },
          { upsert: true }
        );
        await sendTelegramMessage(chatId, `✅ تم ربط رقمك <b>${phone}</b> بحساب Telegram بنجاح!`);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("[Telegram Webhook]", err);
      return res.sendStatus(200);
    }
  });

  // ─── Auth: Verify OTP ─────────────────────────────────────────────────────
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp, name } = req.body as { phone?: string; otp?: string; name?: string };
      if (!phone || !otp) return res.status(400).json({ error: "phone and otp required" });

      const otps = await getOtpsCol();
      const record = await otps.findOne({ phone, code: otp, used: false });

      if (!record) return res.status(401).json({ error: "invalid_otp", message: "رمز التحقق غير صحيح." });
      if (new Date() > new Date(record.expiresAt)) {
        await otps.updateOne({ _id: record._id }, { $set: { used: true } });
        return res.status(401).json({ error: "otp_expired", message: "انتهت صلاحية رمز التحقق." });
      }

      await otps.updateOne({ _id: record._id }, { $set: { used: true } });

      const users = await getUsersCol();
      let user = await users.findOne({ phone });
      if (!user) {
        const newUser = {
          phone,
          name: name || phone,
          role: "patient",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await users.insertOne(newUser);
        user = { _id: result.insertedId, ...newUser };
      }

      return res.json({ success: true, user, message: "تم التحقق بنجاح." });
    } catch (err) {
      console.error("[verify-otp]", err);
      return res.status(500).json({ error: "server_error" });
    }
  });

  // ─── Auth: Register user ──────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, name, role = "patient" } = req.body as {
        phone?: string;
        name?: string;
        role?: string;
      };
      if (!phone || !name) return res.status(400).json({ error: "phone and name required" });

      const users = await getUsersCol();
      const existing = await users.findOne({ phone });
      if (existing) {
        return res.json({ success: true, user: existing, created: false });
      }

      const user = {
        phone,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await users.insertOne(user);
      return res.status(201).json({ success: true, user: { _id: result.insertedId, ...user }, created: true });
    } catch (err: any) {
      if (err.code === 11000) {
        const users = await getUsersCol();
        const existing = await users.findOne({ phone: req.body?.phone });
        return res.json({ success: true, user: existing, created: false });
      }
      console.error("[register]", err);
      return res.status(500).json({ error: "server_error" });
    }
  });

  // ─── Users: Role lookup (checks MongoDB first, falls back to mock) ───────
  app.get("/api/users/role/:phoneNumber", async (req, res) => {
    const { phoneNumber } = req.params;
    try {
      const users = await getUsersCol();
      const user = await users.findOne({ phone: phoneNumber });
      if (user) {
        return res.json({ phoneNumber, role: user.role, message: `${user.role} account found` });
      }
    } catch {}
    const mockRoles: Record<string, string> = {
      "07801111111": "doctor",
      "07802222222": "pharmacist",
    };
    const role = mockRoles[phoneNumber] || "patient";
    return res.json({
      phoneNumber,
      role,
      message: role === "patient" ? "Default patient account" : `${role} account found`,
    });
  });

  app.post("/api/analyze", (_req, res) => {
    setTimeout(() => {
      res.json({
        name: "Paracetamol",
        confidence: 0.985,
        extractedText: "Panadol Advance 500mg Tablets, Paracetamol, GSK",
      });
    }, 800);
  });

  app.get("/api/medicines", (req, res) => {
    const query = String(req.query.query || "")
      .trim()
      .toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(
      1,
      Math.min(20, Number(req.query.pageSize || 10)),
    );

    const filtered = query
      ? medicines.filter(
          (medicine) =>
            medicine.nameAr.toLowerCase().includes(query) ||
            medicine.nameEn.toLowerCase().includes(query),
        )
      : medicines;

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    res.json({
      items: paged,
      page,
      pageSize,
      total: filtered.length,
      hasNextPage: start + pageSize < filtered.length,
    });
  });

  app.get("/api/pharmacies", (req, res) => {
    const governorate = String(req.query.governorate || "")
      .trim()
      .toLowerCase();
    const items = governorate
      ? pharmacies.filter(
          (pharmacy) => pharmacy.governorate.toLowerCase() === governorate,
        )
      : pharmacies;
    res.json({ items });
  });

  app.get("/api/availability", (req, res) => {
    const medicineId = String(req.query.medicineId || "");
    const governorate = String(req.query.governorate || "")
      .trim()
      .toLowerCase();
    const pharmacyIds = availabilityByMedicineId[medicineId] || [];

    const items = pharmacies.filter(
      (pharmacy) =>
        pharmacyIds.includes(pharmacy.id) &&
        (!governorate || pharmacy.governorate.toLowerCase() === governorate),
    );

    res.json({ items });
  });

  app.get("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const allMessages = [...(chatsByPharmacyId[pharmacyId] || [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const limitParam = Number(req.query.limit || 0);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(100, limitParam)
        : 0;
    const before = req.query.before
      ? new Date(String(req.query.before)).getTime()
      : null;

    const filtered = before
      ? allMessages.filter(
          (item) => new Date(item.createdAt).getTime() < before,
        )
      : allMessages;

    if (!limit) {
      return res.json({ items: filtered, hasMore: false, nextBefore: null });
    }

    const items = filtered.slice(-limit);
    const hasMore = filtered.length > items.length;
    const nextBefore = hasMore && items[0] ? items[0].createdAt : null;

    return res.json({ items, hasMore, nextBefore });
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
