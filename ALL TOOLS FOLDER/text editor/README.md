# All In One — Live Editor

A live HTML/CSS/JS playground with AI-assisted code suggestions (Gemini),
built to deploy on Vercel.

## Deploy to Vercel

1. Push this folder to a GitHub repo, then import it at https://vercel.com/new
   (or run `vercel` from inside this folder with the Vercel CLI).
2. In the Vercel dashboard: **Project → Settings → Environment Variables**,
   add `GEMINI_API_KEY` with your key from https://aistudio.google.com/apikey.
3. Deploy. `api/suggest.js` runs as a Serverless Function — it's the only
   place the key is ever used; the browser never sees it.

## Run locally

```
npm i -g vercel
cp .env.example .env.local   # paste your Gemini key
vercel dev
```

Open the local URL it prints (usually http://localhost:3000). AI Suggest
calls `POST /api/suggest`, which `vercel dev` runs as the same serverless
function that ships to production, reading the key from `.env.local`.

## Project structure

```
index.html       the app shell
style.css        styling
script.js        editor logic + calls /api/suggest for AI completions
api/suggest.js   Vercel Serverless Function that proxies Gemini
.env.example     template — copy to .env.local, never commit the real one
```
