// server/index.ts — Standalone Express API server (production use).
// In development, Metro runs on port 5000 and handles /api/* via metro.config.js.

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as path from "path";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  next();
});
app.options("*", (_req, res) => res.sendStatus(200));

// Body parsing
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const duration = Date.now() - start;
    let line = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
    if (line.length > 80) line = line.slice(0, 79) + "…";
    log(line);
  });
  next();
});

(async () => {
  // Register API routes
  const server = await registerRoutes(app);

  // Serve static web build in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
  }

  // Error handler (must be last)
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string };
    const status = error.status || error.statusCode || 500;
    if (res.headersSent) return next(err);
    res.status(status).json({ message: error.message || "Internal Server Error" });
  });

  const port = Number(process.env.PORT) || 5001;
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`Express API server running on port ${port}`);
  });
})();
