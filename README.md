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
7. [Google Calendar Integration](#google-calendar-integration)
8. [Reliability](#reliability)
9. [Security and Privacy](#security-and-privacy)
10. [Limitations](#limitations)
11. [Future Improvements](#future-improvements)

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
| Testing | Vitest |
| Hosting | Vercel (client and serverless API) |

## Project Structure

```
snap2cal/
├── api/
│   └── index.ts          # Vercel serverless entry (exports the Express app)
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
│       ├── index.ts      # Routes, security middleware
│       ├── gemini.ts     # Gemini call, retries, fallbacks
│       └── schema.ts     # Zod schema for extracted events
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

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
1. Retrying each model up to three times with growing delays.
2. Falling back through the models in `GEMINI_FALLBACK_MODELS`.
3. Skipping to the next model if one is no longer available (404).

If extraction still fails, the user can click **Try again** or **Enter details manually** and still get a calendar link.

## Security and Privacy

- API key stays on the server and is never bundled into frontend code.
- File type is checked by MIME type and by file signature (magic bytes), and size is capped at 10 MB.
- Uploads are held in memory only and are never written to disk or stored.
- Helmet security headers, CORS restricted to the client origin, and rate limiting (15 requests per minute).
- Model output is validated with Zod before it reaches the browser. Malformed fields become `null`.
- Error messages are friendly and never expose stack traces or keys.
- No Google account access is requested. The app only generates a link.

> Your poster is processed to extract event information. We do not need access to your Google Calendar account.

## Limitations

- Extraction accuracy depends on poster quality. Always review the details before adding.
- QR codes are not decoded separately. A URL is reported only if the AI can read it as text.
- Posters with several possible dates may need the user to confirm the right one.
- The Vercel deployment has not been load tested.

## Future Improvements

- Dedicated QR code detection
- Download an `.ics` file for Apple Calendar and Outlook
- Server-side test suite for the API
- Support for multi-day and recurring events
- A second AI provider as an extra fallback
- Shared rate limiting across serverless instances

---

Built as a personal project demonstrating AI-assisted productivity tooling.
