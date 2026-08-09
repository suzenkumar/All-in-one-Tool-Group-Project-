# Quill & Frame — Vercel deployment

This version is structured for Vercel: `/api/*.js` files become serverless
functions automatically, `index.html` is served as a static page, and your
Gemini key lives only in Vercel's environment variables — it's read
server-side inside the function and never sent to the browser.

```
Browser  --(prompt only, no key)-->  Vercel serverless function  --(key + prompt)-->  Gemini API
```

## Option A — Deploy via the Vercel dashboard (no CLI needed)

1. Put this project in a GitHub repo (create a new repo, push these files).
2. Go to https://vercel.com → **Add New → Project** → import that repo.
3. Vercel will auto-detect it (no framework needed — it just sees `/api` and
   static files). Leave build settings as default.
4. Before deploying, expand **Environment Variables** and add:
   - Key: `GEMINI_API_KEY`
   - Value: your key from https://aistudio.google.com/apikey
5. Click **Deploy**. Vercel gives you a live URL when it finishes.

To change the key later: Project → Settings → Environment Variables → edit
`GEMINI_API_KEY` → then **Redeploy** (env var changes need a redeploy to
take effect).

## Option B — Deploy via the Vercel CLI

1. Install the CLI (one-time):
   ```
   npm install -g vercel
   ```
2. From this project folder:
   ```
   vercel
   ```
   Follow the prompts (link or create a project). This deploys a preview.
3. Add your key as an environment variable:
   ```
   vercel env add GEMINI_API_KEY
   ```
   Paste your key when prompted, select all environments (Production,
   Preview, Development).
4. Deploy to production:
   ```
   vercel --prod
   ```

## Testing locally before deploying (optional)

```
npm install -g vercel
cp .env.example .env.local   # then edit .env.local with your real key
vercel dev
```
Open the URL it prints (usually http://localhost:3000).

## Files

- `index.html` — the frontend (static, served as-is)
- `api/generate.js` — serverless function, calls Gemini using `GEMINI_API_KEY`
- `api/status.js` — serverless function, tells the frontend whether a key is configured (never returns the key)
- `.env.example` — for local `vercel dev` only; on the real deployment set the var in the dashboard instead

## A note on the rate limiter

`api/generate.js` includes a simple per-IP rate limit (8 requests/minute)
to add friction against casual abuse of your free Gemini quota if this URL
becomes public. Serverless functions can run as multiple parallel
instances though, so this is best-effort, not a hard global cap. For a
stricter limit on a widely-shared deployment, put a real store (e.g.
Vercel KV or Upstash Redis) behind it instead of the in-memory `Map`.
