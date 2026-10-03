# Snap2Cal

> **Turn any event poster into a calendar event in seconds.**

Snap2Cal is a web application that reads an event poster with AI and creates a ready-to-save Google Calendar event. Take a photo or upload an image, check the extracted details, and click once to add the event to Google Calendar. No sign-in is required.

---

## Table of Contents
1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Features](#features)
4. [How It Works](#how-it-works)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Local Setup](#local-setup)
8. [Deploying to Vercel](#deploying-to-vercel)
9. [Google Calendar Integration](#google-calendar-integration)
10. [Reliability](#reliability)
11. [Security and Privacy](#security-and-privacy)
12. [Troubleshooting](#troubleshooting)
13. [Limitations](#limitations)
14. [Future Improvements](#future-improvements)

---

## Overview

Event posters are everywhere (notice boards, social media, WhatsApp groups), but copying their date, time and venue into a calendar by hand is slow and easy to get wrong. Snap2Cal removes that work. The user provides a poster image, the Gemini AI model extracts the event details, and the app generates a Google Calendar link with everything pre-filled.

## Objectives

- Remove the manual effort of typing event details into a calendar.
- Show a practical use of multimodal AI (vision plus structured output) in a simple product.
- Keep the experience friction-free: no account, no Google permissions, no database.
- Stay honest about uncertainty. Low-confidence fields are flagged for the user to verify instead of guessed.
- Keep the API key safe by calling the AI only from the server.

## Features

- **Upload or capture:** drag and drop, file picker, or camera capture on mobile (JPG, PNG, WEBP up to 10 MB).
- **AI extraction:** event name, description, dates, times, timezone, venue, address, organizer, website and category.
- **Editable preview:** every field can be corrected before adding the event.
- **Confidence markers:** fields the AI is unsure about show "Please verify".
- **Live calendar link:** the Google Calendar link updates as the user edits.
- **Add or copy:** open the event in Google Calendar, or copy the link.
- **Non-event detection:** images that aren't event posters are rejected with a clear message.
- **Multilingual posters:** the AI is instructed to handle posters in several languages and keep the original event name.
- **Resilient:** automatic retries, fallback models, and a manual-entry option if extraction fails.
- **Image optimization:** images are downsized in the browser before upload.
- **Polished UI:** responsive layout, 3D hero animation, scanning loader, reduced-motion support.
- **Demo mode:** return a sample event without using Gemini credits.

## How It Works

```
Upload / capture poster
        |
 "Extract Event"  ->  POST /api/extract-event
        |
   Server validates the file
        |
   Gemini vision analysis (structured JSON)
        |
   Zod validation + normalization
        |
   Editable event preview (user reviews)
        |
   "Add to Google Calendar"  ->  calendar.google.com
```

The image is processed in memory and is not stored.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Lucide icons |
| Backend | Node.js, Express, TypeScript |
| AI | Google Gemini API (`@google/genai`) |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit, multer |
| Bundling | esbuild (bundles the server into one Vercel function) |
| Testing | Vitest |
| Hosting | Vercel (static client + one serverless function) |

## Project Structure

```
snap2cal/
├── api/
│   └── index.mjs         # GENERATED bundle of the Express server (Vercel function). Committed on purpose.
├── client/
│   ├── src/
│   │   ├── App.tsx       # Main UI and state flow
│   │   ├── Hero3D.tsx    # 3D animated hero scene
│   │   ├── index.css     # Tailwind import and animations
│   │   ├── main.tsx
│   │   └── utils/
│   │       ├── calendar.ts       # Calendar URL + validation
│   │       ├── calendar.test.ts  # Unit tests
│   │       └── image.ts          # Client-side image downscaling
│   ├── index.html
│   └── vite.config.ts    # Dev proxy: /api -> localhost:5000
├── server/
│   └── src/
│       ├── index.ts      # Routes, security middleware (source of truth for the API)
│       ├── gemini.ts     # Gemini call, retries, fallbacks
│       └── schema.ts     # Zod schema for extracted events
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

> **Important:** `api/index.mjs` is generated from `server/src/*`. Never edit it by hand. After changing anything in `server/src`, run `npm run build:api` and commit the updated file.

## Local Setup

Requirements: Node.js 20 or newer.

1. Install dependencies:
   ```
   npm install
   npm run install:all
   ```
2. Create a `.env` file in the repository root (never commit it). Each line must start at the left edge, with no leading spaces:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3.5-flash
   GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
   ```
   Set `DEMO_MODE=true` to return a sample event without calling Gemini.
3. Start the API and the client in two terminals:
   ```
   npm run dev:server
   npm run dev:client
   ```
4. Open `http://localhost:5173`. Check `http://localhost:5000/api/health` to confirm the key and model are loaded.

Useful checks before deploying:
```
npm test                       # unit tests
npm --prefix client run build  # same type-check + build Vercel runs
npm run build:api              # regenerates api/index.mjs
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini API key (server only) |
| `GEMINI_MODEL` | No | Primary model. Default `gemini-3.5-flash` |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback models, e.g. `gemini-3.1-flash-lite` |
| `DEMO_MODE` | No | `true` returns a sample event without calling Gemini |
| `GEMINI_TIMEOUT_MS` | No | Per-request timeout (default 15000) |
| `EXTRACT_DEADLINE_MS` | No | Total time allowed for retries (default 25000) |
| `PORT`, `CLIENT_URL` | Local only | Not needed on Vercel |

## Deploying to Vercel

The client is built to static files (`client/dist`) and the whole Express server runs as a single serverless function (`api/index.mjs`). `vercel.json` routes `/api/*` to that function and everything else to the app.

1. Run `npm run build:api` locally and commit `api/index.mjs` together with your changes, then push to GitHub.
2. In Vercel, import the repository (**Add New → Project**).
3. In project settings, use:
   - **Root Directory:** repository root (leave blank)
   - **Framework Preset:** **Other**
   - Leave the Build, Install and Output overrides **off**. `vercel.json` controls them.
4. Add these environment variables (Production and Preview): `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`. Do not import your whole local `.env`.
5. Deploy. Environment variable changes only apply to new deployments, so **redeploy** after changing them.
6. Verify: open `https://<your-app>.vercel.app/api/health`. Expect `{"ok":true,"hasKey":true,...}`. Then upload a poster.
7. For a public link, make sure **Deployment Protection** is turned off for production in project settings.

## Google Calendar Integration

Snap2Cal does **not** use the Google Calendar API or OAuth. It builds a Google Calendar template link:

```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=Event+Name
  &dates=20261015T100000/20261015T130000
  &ctz=Asia/Kolkata
  &details=...
  &location=...
```

- Dates use local time (`YYYYMMDDTHHMMSS`) with the `ctz` parameter, so times are never shifted by a timezone conversion.
- If there is no end time, the event defaults to one hour long.
- All values are URL-encoded.
- Required fields: event name, date and start time. The button stays disabled until they are filled in.
- The link is rebuilt each time the user edits a field.

## Reliability

Gemini can sometimes be busy (HTTP 503). The server handles this by:
1. Trying each model up to two times, with growing delays between attempts.
2. Falling back through the models in `GEMINI_FALLBACK_MODELS`.
3. Skipping to the next model if one is no longer available (404).
4. Stopping after an overall deadline (`EXTRACT_DEADLINE_MS`) so the request finishes inside the Vercel function time limit.

If extraction still fails, the user can click **Try again** or **Enter details manually** and still get a calendar link.

Model names change over time. Check the current list in the Gemini API documentation and prefer stable models over short-term-availability ones.

## Security and Privacy

- API key stays on the server and is never bundled into frontend code.
- File type is checked by MIME type and by file signature (magic bytes), and size is capped at 10 MB.
- Uploads are held in memory only and are never written to disk or stored.
- Helmet security headers, CORS restricted to the client origin, and rate limiting (15 requests per minute per instance).
- Model output is validated with Zod before it reaches the browser. Malformed fields become `null`.
- Error messages are friendly and never expose stack traces or keys.
- No Google account access is requested. The app only generates a link.
- `.env` is git-ignored. Never commit API keys.

> Your poster is processed to extract event information. We do not need access to your Google Calendar account.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `FUNCTION_INVOCATION_FAILED` / "Cannot use import statement outside a module" | The server was deployed unbundled or with the wrong preset. Set Framework Preset to **Other**, run `npm run build:api`, commit `api/index.mjs`, redeploy. |
| `/api/health` returns the web page instead of JSON | `vercel.json` is not at the repo root, or the preset is wrong. |
| `hasKey: false` | `GEMINI_API_KEY` is missing in Vercel. Add it and redeploy. |
| Upload says "Couldn't read this poster clearly" (502) | Gemini call failed. Check Vercel runtime logs for the `extract failed:` line (bad key, retired model, quota). |
| 404 from Gemini | Model name retired. Update `GEMINI_MODEL` and redeploy. |
| 401 or a Vercel login page | Deployment Protection is on. Disable it for public access. |
| 504 timeout | Gemini was slow. Try again, or lower `EXTRACT_DEADLINE_MS`. |
| "Network problem" in the UI | Generic catch-all message. Open the browser Network tab to see the real status code. |

## Limitations

- Extraction accuracy depends on poster quality. Always review the details before adding.
- QR codes are not decoded separately. A URL is reported only if the AI can read it as text.
- Posters with several possible dates may need the user to confirm the right one.
- Rate limiting is per serverless instance, so it is approximate on Vercel.
- The Vercel deployment has not been load tested.

## Future Improvements

- Dedicated QR code detection
- Download an `.ics` file for Apple Calendar and Outlook
- Server-side test suite for the API
- Support for multi-day and recurring events
- A second AI provider as an extra fallback
- Shared rate limiting across serverless instances
- Build `api/index.mjs` automatically in CI instead of committing it

---

Built as a personal project demonstrating AI-assisted productivity tooling.
