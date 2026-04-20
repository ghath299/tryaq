import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
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

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

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
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
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

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
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

function configureExpoAndLanding(
  app: express.Application,
  server: import("http").Server,
) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  const publicDomain =
    process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "localhost";

  // Rewrites all Metro :8081 references → publicDomain (port 80/443)
  function rewriteManifestBody(body: string): string {
    // exp://HOST:8081 → exp://HOST  (Expo Go manifest URL)
    body = body.replace(/exp:\/\/[^"'\\]+:8081/g, `exp://${publicDomain}`);
    // http://HOST:8081 → https://HOST  (bundle, asset URLs)
    body = body.replace(/http:\/\/[^"'\\]+:8081/g, `https://${publicDomain}`);
    return body;
  }

  // ── Manifest endpoints: fetch manually, rewrite URLs, stream back ──────
  // Metro serves the manifest at "/", "/_expo/manifest", and with query params
  const MANIFEST_PATHS = ["/", "/_expo/manifest"];

  for (const mPath of MANIFEST_PATHS) {
    app.get(mPath, async (req: Request, res: Response, next: NextFunction) => {
      // Browser (no Expo header) → landing page
      if (
        mPath === "/" &&
        !req.header("expo-platform") &&
        !req.header("exponent-platform")
      ) {
        return serveLandingPage({ req, res, landingPageTemplate, appName });
      }

      try {
        const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
        const metroUrl = `http://localhost:8081${mPath}${qs}`;
        const metroRes = await fetch(metroUrl, {
          headers: {
            ...Object.fromEntries(
              Object.entries(req.headers).filter(([k]) => k !== "host"),
            ),
            host: "localhost:8081",
          } as HeadersInit,
          signal: AbortSignal.timeout(15000),
        });

        const ct = metroRes.headers.get("content-type") ?? "";
        let body = await metroRes.text();

        if (ct.includes("application/json") || ct.includes("text/")) {
          body = rewriteManifestBody(body);
        }

        for (const [key, val] of metroRes.headers.entries()) {
          if (key.toLowerCase() !== "content-length") res.setHeader(key, val);
        }
        res.status(metroRes.status).send(body);
      } catch {
        res
          .status(503)
          .send("Metro bundler not running.\nRun: bash start-expo.sh");
      }
    });
  }

  // ── Streaming proxy for bundles, assets, hot-reload ────────────────────
  // No buffering — large bundles stream directly from Metro to Expo Go.
  // proxyTimeout 5 min: first-run bundle compilation can take a long time.
  const metroProxy = createProxyMiddleware({
    target: "http://localhost:8081",
    changeOrigin: true,
    ws: true,
    proxyTimeout: 5 * 60 * 1000,
    timeout: 5 * 60 * 1000,
    on: {
      error: (_err, _req, res) => {
        if (res && "writeHead" in res) {
          (res as import("http").ServerResponse).writeHead(503);
          (res as import("http").ServerResponse).end(
            "Metro bundler not running. Run: bash start-expo.sh",
          );
        }
      },
    },
  });

  // Forward WebSocket upgrades to Metro (hot-reload)
  server.on("upgrade", (req, socket, head) => {
    (metroProxy as any).upgrade(req, socket, head);
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) return next();
    return (metroProxy as any)(req, res, next);
  });

  app.use(express.static(path.resolve(process.cwd(), "dist")));

  log(`Expo proxy → Metro :8081  |  connect Expo Go to: exp://${publicDomain}`);
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

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

  configureExpoAndLanding(app, server);

  setupErrorHandler(app);

  const port = 5000;

  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`Express API server running on port ${port}`);
  });
})();
