// Vercel Serverless Function — runs on Vercel's servers, never in the
// browser. Reads GEMINI_API_KEY from Vercel's Environment Variables
// (Project Settings → Environment Variables), so the key is never
// shipped to the client.
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // .trim() matters: a stray newline/space pasted into the Vercel
    // dashboard env var makes fetch() throw "Invalid character in
    // header content", which crashes the whole function (500) instead
    // of returning a clean error.
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable' });
    }

    // Body is usually pre-parsed by Vercel, but guard in case it
    // arrives as a raw string.
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { lang, before } = body || {};
    if (!before || typeof before !== 'string') {
      return res.status(400).json({ error: 'Missing "before" code context' });
    }

    if (typeof fetch !== 'function') {
      return res.status(500).json({ error: 'This function needs Node.js 18+ (fetch is missing). Set Node version in Vercel Project Settings → General.' });
    }

    const prompt = `Code so far (${lang}):\n${before}`;
    const system = 'You are a code completion engine. Given the code so far, output ONLY the code that comes next — no explanation, no markdown fences, no repeating the existing code, no preamble.';

    let lastErr = '';
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0 }
          })
        });
      } catch (fetchErr) {
        lastErr = fetchErr.message;
        continue;
      }

      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error?.message || `Gemini HTTP ${response.status}`;
        lastErr = msg;
        // Key/quota/network errors won't be fixed by retrying another model
        if (!/model|not found|not available|does not exist/i.test(msg)) {
          break;
        }
        continue;
      }

      const text = (data.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || '').join('').trim();
      if (text) {
        return res.status(200).json({ text });
      }
      lastErr = 'empty response';
    }

    return res.status(502).json({ error: lastErr || 'Gemini returned no suggestion' });
  } catch (e) {
    console.error('suggest.js crashed:', e);
    return res.status(500).json({ error: e.message || 'Unknown server error' });
  }
};
