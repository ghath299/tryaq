// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/mockData.ts
var medicines = [
  {
    id: "1",
    nameAr:
      "\u0628\u0627\u0631\u0627\u0633\u064A\u062A\u0627\u0645\u0648\u0644",
    nameEn: "Paracetamol",
  },
  {
    id: "2",
    nameAr:
      "\u0623\u0645\u0648\u0643\u0633\u064A\u0633\u064A\u0644\u064A\u0646",
    nameEn: "Amoxicillin",
  },
  {
    id: "3",
    nameAr: "\u0623\u0648\u0645\u064A\u0628\u0631\u0627\u0632\u0648\u0644",
    nameEn: "Omeprazole",
  },
  {
    id: "4",
    nameAr: "\u0645\u064A\u062A\u0641\u0648\u0631\u0645\u064A\u0646",
    nameEn: "Metformin",
  },
  {
    id: "5",
    nameAr:
      "\u0623\u062A\u0648\u0631\u0641\u0627\u0633\u062A\u0627\u062A\u064A\u0646",
    nameEn: "Atorvastatin",
  },
];
var pharmacies = [
  {
    id: "1",
    nameAr:
      "\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0634\u0641\u0627\u0621",
    nameEn: "Al-Shifa Pharmacy",
    governorate: "Baghdad",
    governorateAr: "\u0628\u063A\u062F\u0627\u062F",
    phone: "+9647701112222",
  },
  {
    id: "2",
    nameAr:
      "\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u062D\u064A\u0627\u0629",
    nameEn: "Al-Hayat Pharmacy",
    governorate: "Baghdad",
    governorateAr: "\u0628\u063A\u062F\u0627\u062F",
    phone: "+9647702223333",
  },
  {
    id: "3",
    nameAr:
      "\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u0646\u0648\u0631",
    nameEn: "Al-Nour Pharmacy",
    governorate: "Basra",
    governorateAr: "\u0627\u0644\u0628\u0635\u0631\u0629",
    phone: "+9647703334444",
  },
];
var availabilityByMedicineId = {
  1: ["1", "2", "3"],
  2: ["1", "3"],
  3: ["2"],
  4: ["1", "2"],
  5: ["3"],
};
var chatsByPharmacyId = {
  1: [
    {
      id: "m1",
      text: "\u0623\u0647\u0644\u0627\u064B \u0648\u0633\u0647\u0644\u0627\u064B\u060C \u0643\u064A\u0641 \u0646\u0643\u062F\u0631 \u0646\u0633\u0627\u0639\u062F\u0643\u061F",
      sender: "pharmacy",
      createdAt: /* @__PURE__ */ new Date().toISOString(),
    },
  ],
};

// server/routes.ts
async function registerRoutes(app2) {
  app2.use((req, res, next) => {
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
  app2.get("/api/users/role/:phoneNumber", (req, res) => {
    const { phoneNumber } = req.params;
    const mockRoles = {
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
  app2.post("/api/analyze", (_req, res) => {
    setTimeout(() => {
      res.json({
        name: "Paracetamol",
        confidence: 0.985,
        extractedText: "Panadol Advance 500mg Tablets, Paracetamol, GSK",
      });
    }, 800);
  });
  app2.get("/api/medicines", (req, res) => {
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
  app2.get("/api/pharmacies", (req, res) => {
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
  app2.get("/api/availability", (req, res) => {
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
  app2.get("/api/chats/:pharmacyId/messages", (req, res) => {
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
  app2.post("/api/chats/:pharmacyId/messages", (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const message = {
      id: `m-${Date.now()}`,
      text: req.body?.text,
      imageUrl: req.body?.imageUrl,
      sender: "patient",
      createdAt: /* @__PURE__ */ new Date().toISOString(),
    };
    if (!chatsByPharmacyId[pharmacyId]) chatsByPharmacyId[pharmacyId] = [];
    chatsByPharmacyId[pharmacyId].push(message);
    res.status(201).json({ item: message });
  });
  app2.post("/api/uploads/chat-image", (_req, res) => {
    res.status(201).json({
      imageUrl: `https://placehold.co/600x400/png?text=chat+image+${Date.now()}`,
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept",
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );
  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({ req, res, landingPageTemplate, appName }) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "dist")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  const server = await registerRoutes(app);
  configureExpoAndLanding(app);
  setupErrorHandler(app);
  const port = Number(process.env.PORT) || 5e3;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Express API server running on port ${port}`);
    },
  );
})();
