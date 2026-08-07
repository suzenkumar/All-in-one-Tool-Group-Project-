# Margdarshak — AI Student Mentor (Vercel-ready)

An AI mentor for students with a **secure architecture**, built to deploy on Vercel. The Gemini API key never reaches the browser — it lives in Vercel's environment variables and is only ever used inside a serverless function.

```
Browser (index.html)  →  Vercel Serverless Function (api/chat.js)  →  Gemini API
      no key here              key lives here only (Vercel env vars)
```

## Features
- **Study Help** — step-by-step explanations, problem solving, quizzing
- **Career Guidance** — career paths, skill roadmaps, higher-studies-vs-job advice
- **Interview Prep** — mock interviews with question-by-question feedback
- **Parent Counseling** — helps parents support their child's education/career decisions
- Each mode has its own chat history, tailored system prompt, and accent color
- Model switch between Gemini 3.6 Flash (smarter) and Gemini 3.5 Flash-Lite (faster) — both free, with automatic fallback if Google retires a model name

## Deploy to Vercel

**1. Get a free Gemini API key** — https://aistudio.google.com/apikey, sign in with any Google account, click "Create API Key." No credit card needed.

**2. Push this project to a GitHub repo** (a private repo is fine — Vercel just needs to read it).

**3. Import it into Vercel:**
   - Go to https://vercel.com, sign in, click **Add New → Project**
   - Select your GitHub repo → Vercel will auto-detect it as a static site with an `api/` function — no build settings needed, leave everything default
   - Before clicking Deploy, open **Environment Variables** and add:
     - Key: `GEMINI_API_KEY`
     - Value: your real key from step 1
   - Click **Deploy**

**4. Done** — Vercel gives you a live URL (like `margdarshak.vercel.app`). Open it, pick a mode, and start chatting.

Any time you change the code, push to GitHub and Vercel redeploys automatically.

## Running it locally before deploying (optional but recommended)
```
npm install -g vercel
vercel login
vercel dev
```
`vercel dev` reads a local `.env` file automatically (copy `.env.example` → `.env` and paste in your key) and runs the same serverless function setup on your machine at `http://localhost:3000`.

## Why this is secure
- The Gemini key exists only as a Vercel environment variable and inside `api/chat.js`, which runs on Vercel's servers — it is never included in `index.html` or any response sent to the browser.
- `.env` (used only for local testing) is listed in `.gitignore`, so it can't accidentally get pushed to GitHub.
- The frontend only ever calls `/api/chat` on your own deployed domain.
- Even with DevTools open or viewing page source on the live site, there is no key anywhere in what the browser receives.

**One thing to still keep in mind:** a public deployment with no login means anyone who finds your URL can send chat requests through it, using your free Gemini quota (they still can't see or steal the key itself). For a college project demo this is a non-issue; if you want to lock it down further later, options include a simple shared password check inside `api/chat.js` or Vercel's built-in password protection (Pro plans).

## Project structure
```
index.html        ← frontend (UI, chat logic) — no secrets here, served as your homepage
api/chat.js        ← Vercel Serverless Function — the only place the API key is used
package.json       ← minimal config (marks the project as using ES modules)
.env.example       ← template for local `vercel dev` testing only
.env               ← (you create this, locally only) — gitignored, never share it
.gitignore         ← keeps .env, node_modules, and .vercel out of version control
README.md          ← this file
```

## Tech used
- **Frontend:** Plain HTML / CSS / JavaScript, no framework — easy to explain in a viva
- **Backend:** One Vercel Serverless Function (Node.js) — no Express needed
- **API:** Gemini `generateContent` (`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`) — free tier, no card required (rate limits can change: https://ai.google.dev/gemini-api/docs/rate-limits)
