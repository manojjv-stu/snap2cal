# Snap2Cal
*Turn any event poster into a calendar event in seconds.*

## Overview
Upload or capture an event poster. The server sends it to Gemini, validates the extracted details, and the app builds a pre-filled Google Calendar link. No Google sign-in, no database, no stored images.

## Features
Upload / drag-and-drop / camera capture, editable event form, "Please verify" markers for low-confidence fields, live-updating calendar link, copy link, friendly errors, demo mode.

## Architecture
`client` (React + Vite + Tailwind v4) -> `POST /api/extract-event` -> `server` (Express + Zod + Gemini). The calendar URL is generated in the browser from the edited event data.

## Structure
    client/src/App.tsx, utils/calendar.ts (+ tests)
    server/src/index.ts (routes, security), gemini.ts (AI), schema.ts (Zod)

## Environment variables (root `.env`)
`GEMINI_API_KEY`, `PORT=5000`, `CLIENT_URL=http://localhost:5173`, `DEMO_MODE=false`. Never commit `.env`.

## Local setup
    npm run install:all
    npm run dev:server     # terminal 1
    npm run dev:client     # terminal 2 -> http://localhost:5173
    npm test

## Gemini setup
Create a key at https://aistudio.google.com/apikey and set `GEMINI_API_KEY`. Model: `gemini-2.5-flash`. Set `DEMO_MODE=true` to skip Gemini.

## API
`POST /api/extract-event` multipart field `image` (JPG/PNG/WEBP, max 10 MB).
Success: `{"success":true,"event":{...}}`. Error: `{"success":false,"error":"message"}`.

## Google Calendar integration
`https://calendar.google.com/calendar/render?action=TEMPLATE&text=..&dates=20261015T100000/20261015T130000&ctz=Asia/Kolkata&details=..&location=..` - local time plus `ctz`, all values URL-encoded. Missing end time defaults to +1 hour.

## Security
Helmet, CORS, rate limit (15/min), MIME + magic-byte validation, memory-only uploads, key never sent to the browser.

## Deployment
Client: Vercel (root `client`, build `npm run build`; route `/api` to your server). Server: Render/Railway/Fly (`npm run build`, `npm start`; set env vars in the dashboard).

## Troubleshooting
- "Couldn't read this poster": check the key, server logs, and try `DEMO_MODE=true`.
- CORS error: make `CLIENT_URL` match the client origin.
- Port in use: change `PORT` and the proxy in `client/vite.config.ts`.

## Future improvements
Image resize, QR detection, server tests, serverless adapter, .ics download.
