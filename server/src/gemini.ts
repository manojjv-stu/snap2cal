import { GoogleGenAI } from "@google/genai";
import { EventSchema, EventData } from "./schema.js";

const DEMO: EventData = { is_event_poster: true, event_name: "Tech Innovators Meetup", description: "A technology networking and innovation event.", start_date: "2026-10-15", start_time: "10:00", end_date: null, end_time: null, timezone: "Asia/Kolkata", venue: "RV College of Engineering", address: "Bengaluru, Karnataka", organizer: null, url: null, category: "Technology", confidence: { overall: 0.9, event_name: 0.98, date: 0.95, time: 0.9, venue: 0.9 } };

const SYSTEM = `You are an event poster information extraction system.
Extract ONLY information visually supported by the image. Never invent or guess; use null when unknown.
Return ONLY JSON with keys: is_event_poster (boolean), event_name, description, start_date (YYYY-MM-DD), start_time (24h HH:MM), end_date, end_time, timezone (IANA, only if shown), venue, address, organizer, url, category, confidence {overall,event_name,date,time,venue} (0-1).
Prefer the actual event date/time over registration/submission deadlines, early-bird or sponsor dates. If several event dates are plausible or the year is missing, use null for the date field and lower the date confidence.
Keep the original-language event name. A QR code URL may be reported in url only if readable; never assume it.
If the image is not an event poster, set is_event_poster to false.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function extractEvent(buf: Buffer, mimeType: string): Promise<EventData> {
  if (process.env.DEMO_MODE === "true") return DEMO;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = [process.env.GEMINI_MODEL || "gemini-3.8-flash", ...(process.env.GEMINI_FALLBACK_MODELS ?? "").split(",").map((m) => m.trim())].filter(Boolean);
  const contents = [{ role: "user", parts: [{ inlineData: { mimeType, data: buf.toString("base64") } }, { text: `Today is ${new Date().toISOString().slice(0, 10)}. Extract the event.` }] }];
  let lastErr: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({ model, contents, config: { systemInstruction: SYSTEM, responseMimeType: "application/json", temperature: 0 } });
        const raw = (res.text ?? "").replace(/```json|```/g, "").trim();
        return EventSchema.parse(JSON.parse(raw));
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        if (/404|NOT_FOUND/i.test(msg)) break; // model gone: go to next model
        if (!/503|UNAVAILABLE|429|overloaded|high demand|fetch failed/i.test(msg)) throw e;
        await sleep(1000 * 2 ** attempt + Math.random() * 500);
      }
    }
  }
  throw lastErr;
}
