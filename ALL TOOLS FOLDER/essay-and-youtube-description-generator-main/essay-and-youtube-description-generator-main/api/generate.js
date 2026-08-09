// api/generate.js
// Vercel serverless function: POST /api/generate
// The ONLY place GEMINI_API_KEY is read. Set it in Vercel's dashboard under
// Project Settings -> Environment Variables — never commit it to the repo.
// The key never appears in the response sent to the browser.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// Best-effort per-instance rate limit. Serverless functions can run as
// multiple concurrent instances, so this is NOT a strict global limit —
// it just adds friction against casual abuse. For a real limit on a public
// deployment, put Vercel's Edge Config or Upstash Redis in front of this.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Server is not configured with GEMINI_API_KEY. Add it in Vercel Project Settings -> Environment Variables and redeploy.',
    });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a minute and try again.' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'Missing "prompt" in request body.' });
  }
  if (prompt.length > 6000) {
    return res.status(400).json({ error: 'Prompt is too long.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      // Don't forward Google's raw error body verbatim (it can echo the key/URL back).
      return res.status(502).json({ error: `Gemini request failed (status ${geminiRes.status}).` });
    }

    const data = await geminiRes.json();
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('').trim();

    if (!text) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
}
