# Snap2Cal
*Turn any event poster into a calendar event in seconds.*

## Overview
Upload or capture an event poster. The server sends it to Gemini, validates the extracted details, and the app builds a pre-filled Google Calendar link. No Google sign-in, no database, no stored images.

## Features
Upload / drag-and-drop / camera capture, editable event form, "Please verify" markers for low-confidence fields, live-updating calendar link, copy link, friendly errors, demo mode.


## Troubleshooting
- "Couldn't read this poster": check the key, server logs, and try `DEMO_MODE=true`.
- CORS error: make `CLIENT_URL` match the client origin.
- Port in use: change `PORT` and the proxy in `client/vite.config.ts`.

## Future improvements
Image resize, QR detection, server tests, serverless adapter, .ics download.
