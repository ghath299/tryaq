// metro.config.js — Metro runs on port 5000 and serves BOTH the RN bundle
// and the Express API routes via enhanceMiddleware.
// No separate Express server, no proxy, no ghath.

const { getDefaultConfig } = require("expo/metro-config");

// Public domain for URL rewriting (Replit maps port 5000 → external port 80)
const publicDomain =
  process.env.REPLIT_DEV_DOMAIN ||
  process.env.REPLIT_DOMAINS ||
  "localhost";

// ── Load TypeScript API routes via tsx CJS hook ──────────────────────────
let apiMiddleware = null;
try {
  require("./node_modules/tsx/dist/cjs/index.cjs");
  const express = require("express");
  const { registerRoutes } = require("./server/routes");

  const apiApp = express();
  apiApp.use(express.json());
  apiApp.use(express.urlencoded({ extended: false }));
  registerRoutes(apiApp);
  apiMiddleware = apiApp;
  console.log("[Metro] ✓ API routes loaded (/api/*)");
} catch (e) {
  console.warn("[Metro] ⚠ API routes not loaded:", e.message);
}

// ── URL rewriter: replaces :5000 with no-port (Replit maps 5000 → port 80) ──
function rewriteUrls(text) {
  // exp://HOST:5000 → exp://HOST  (Expo Go connects via port 80)
  text = text.replace(
    new RegExp(`exp://${publicDomain.replace(/\./g, "\\.")}:5000`, "g"),
    `exp://${publicDomain}`,
  );
  // http://HOST:5000 → https://HOST  (bundle & asset downloads via HTTPS)
  text = text.replace(
    new RegExp(`http://${publicDomain.replace(/\./g, "\\.")}:5000`, "g"),
    `https://${publicDomain}`,
  );
  return text;
}

// ── Metro config ──────────────────────────────────────────────────────────
const config = getDefaultConfig(__dirname);

config.server = {
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      // ── API routes → Express ────────────────────────────────────────────
      if (apiMiddleware && req.url && req.url.startsWith("/api")) {
        return apiMiddleware(req, res, next);
      }

      // ── Manifest endpoints: intercept + rewrite URLs ────────────────────
      // Metro serves manifests at "/" (with expo headers) and "/_expo/manifest"
      const url = req.url || "";
      const isManifest =
        url === "/" ||
        url.startsWith("/?") ||
        url === "/_expo/manifest" ||
        url.startsWith("/_expo/manifest?");

      if (isManifest) {
        const chunks = [];
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);

        res.write = function (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        };

        res.end = function (chunk) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const ct = String(res.getHeader("content-type") || "");
          if (ct.includes("application/json") || ct.includes("text/")) {
            let body = Buffer.concat(chunks).toString("utf8");
            body = rewriteUrls(body);
            res.removeHeader("content-length");
            res.setHeader("content-length", Buffer.byteLength(body, "utf8"));
            return originalEnd(body);
          }
          return originalEnd(Buffer.concat(chunks));
        };
      }

      // ── Everything else → Metro ─────────────────────────────────────────
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
