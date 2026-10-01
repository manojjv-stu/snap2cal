import express from "express";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { extractEvent } from "./gemini.js";

const app = express();
const OK = ["image/jpeg", "image/png", "image/webp"];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const fail = (res: express.Response, code: number, error: string) => res.status(code).json({ success: false, error });

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.VERCEL ? false : (process.env.CLIENT_URL ?? "http://localhost:5173") }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 15, standardHeaders: true, message: { success: false, error: "Too many requests. Please wait a minute and try again." } }));

app.post("/api/extract-event", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return fail(res, 400, err.code === "LIMIT_FILE_SIZE" ? "Image is larger than 10 MB." : "Couldn't read the upload.");
    const f = req.file;
    if (!f) return fail(res, 400, "Please select a poster image first.");
    const b = f.buffer;
    const magic = (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50) || (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP");
    if (!OK.includes(f.mimetype) || !magic) return fail(res, 400, "Unsupported format. Use JPG, PNG or WEBP.");
    try {
      const { is_event_poster, ...event } = await extractEvent(b, f.mimetype);
      if (!is_event_poster || !event.event_name) return fail(res, 422, "This doesn't look like an event poster. Try another image.");
      res.json({ success: true, event });
    } catch (e) {
      console.error("extract failed:", e instanceof Error ? e.message : e);
      fail(res, 502, "Couldn't read this poster clearly. Try a sharper image or try again.");
    }
  });
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 5000);
  app.listen(port, () => console.log(`Snap2Cal API on :${port}`));
}
export default app;
