// api/status.js
// Vercel serverless function: GET /api/status
// Tells the frontend whether a key is configured — never returns the key itself.

export default function handler(req, res) {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.status(200).json({ hasKey });
}
