// Vercel Serverless Function — runs on Vercel's servers, never in the browser.
// The Gemini API key is read from process.env.GEMINI_API_KEY, which you set
// in the Vercel dashboard (Project → Settings → Environment Variables).
// It is never included in anything sent back to the browser.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Google renames/retires Gemini model IDs fairly often. If the requested model
// comes back "no longer available", automatically retry with the next model
// in its fallback chain instead of just failing.
const FALLBACK_CHAINS = {
  "gemini-3.6-flash": ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash"],
  "gemini-3.5-flash-lite": ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: "Method not allowed. Use POST." } });
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    res.status(500).json({
      error: { message: "Server is missing GEMINI_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy." }
    });
    return;
  }

  const { contents, systemInstruction, model } = req.body || {};
  if (!Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: { message: "Request must include a non-empty 'contents' array." } });
    return;
  }

  const chain = FALLBACK_CHAINS[model] || [model || "gemini-3.6-flash"];
  let lastErrText = '';

  for (const modelId of chain) {
    try {
      const url = `${GEMINI_BASE}/${modelId}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        res.status(200).json(data);
        return;
      }

      const errBody = await response.json().catch(() => ({}));
      lastErrText = errBody?.error?.message || `Request failed (status ${response.status})`;
      if (response.status !== 404 && !/no longer available/i.test(lastErrText)) break;
    } catch (err) {
      lastErrText = err.message;
      break;
    }
  }

  res.status(502).json({ error: { message: lastErrText || "Unknown error contacting Gemini." } });
}
