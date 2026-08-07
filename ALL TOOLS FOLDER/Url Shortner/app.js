const path = require("path");
const crypto = require("crypto");
const express = require("express");
require("dotenv").config();

function createApp() {
  const app = express();

  // Simple in-memory rate limiter (per IP) to keep things friendly.
  const windowMs = 60 * 1000;
  const maxHits = 20;
  const hits = new Map();

  function rateLimit(req, res, next) {
    const now = Date.now();
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "unknown";
    const bucket = hits.get(ip);
    if (!bucket || bucket.resetAt < now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > maxHits) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a moment and try again.",
      });
    }
    next();
  }

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  function normalizeUrl(raw) {
    let url = (raw || "").trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      if (!parsed.hostname.includes(".")) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  // Detects which free API family the configured URL belongs to and
  // shortens accordingly. Supports is.gd, TinyURL, shrtco and 0x0.st.
  async function callShortener(apiUrl, apiKey, longUrl) {
    const target = new URL(apiUrl);
    const isZeroX = target.hostname.includes("0x0.st");
    const isShrtco = target.hostname.includes("shrtco");
    const params = new URLSearchParams(target.search);

    let res;
    if (isZeroX) {
      const form = new URLSearchParams();
      form.set("url", longUrl);
      res = await fetch(apiUrl, { method: "POST", body: form });
    } else {
      params.set("url", longUrl);
      if (apiKey && !isShrtco) params.set("apikey", apiKey);
      target.search = params.toString();
      res = await fetch(target.toString());
    }

    const text = (await res.text()).trim();
    if (!res.ok) {
      throw new Error(`Shortener API responded ${res.status}: ${text || "unknown error"}`);
    }

    // 0x0.st, TinyURL (plain text)
    if (!text.startsWith("{")) {
      if (/^https?:\/\//.test(text)) return text;
      throw new Error(`Unexpected response from shortener: ${text}`);
    }

    const data = JSON.parse(text);
    if (isShrtco) {
      if (data.ok && data.result && data.result.full_short_link) {
        return data.result.full_short_link;
      }
      const msg =
        data.error &&
        (data.error.code === 2
          ? "A short URL for this link already exists."
          : data.error);
      throw new Error(typeof msg === "string" ? msg : "Could not shorten URL.");
    }
    // is.gd
    if (data.shorturl) return data.shorturl;
    throw new Error(data.errormessage || "Could not shorten URL.");
  }

  app.post("/api/shorten", rateLimit, async (req, res) => {
    const longUrl = normalizeUrl(req.body && req.body.url);
    if (!longUrl) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid URL (e.g. https://example.com/page).",
      });
    }

    const apiUrl =
      process.env.SHORTENER_API_URL || "https://tinyurl.com/api-create.php";
    const apiKey = (process.env.SHORTENER_API_KEY || "").trim();

    try {
      const shortUrl = await callShortener(apiUrl, apiKey, longUrl);
      const id = crypto.randomBytes(4).toString("hex");
      res.json({
        success: true,
        id,
        shortUrl,
        longUrl,
        provider: new URL(apiUrl).hostname,
      });
    } catch (err) {
      console.error("Shorten error:", err.message);
      res.status(502).json({
        success: false,
        error: err.message,
        hint: "Check SHORTENER_API_URL in your environment variables.",
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      provider: (process.env.SHORTENER_API_URL || "")
        .replace(/\/$/, "")
        .replace("https://", ""),
    });
  });

  return app;
}

module.exports = createApp;
