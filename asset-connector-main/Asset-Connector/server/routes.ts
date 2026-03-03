import type { Express } from "express";
import { createServer, type Server } from "node:http";
import {
  medicines,
  pharmacies,
  availabilityByMedicineId,
  chatsByPharmacyId,
  type ChatMessage,
} from "./mockData";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.get("/api/users/role/:phoneNumber", (req, res) => {
    const { phoneNumber } = req.params;
    const mockRoles: Record<string, string> = {
      "07801111111": "doctor",
      "07802222222": "pharmacist",
    };
    const role = mockRoles[phoneNumber] || "patient";
    res.json({
      phoneNumber,
      role,
      message:
        role === "patient"
          ? "Default patient account"
          : `${role} account found`,
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
