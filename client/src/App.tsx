import { useMemo, useRef, useState } from "react";
import { CalendarPlus, Camera, Upload, Copy, Check, AlertTriangle, CalendarDays } from "lucide-react";
import Hero3D from "./Hero3D";
import { shrink } from "./utils/image";
import { buildCalendarUrl, missingFields, CalendarEvent } from "./utils/calendar";

type Conf = { overall: number; event_name: number; date: number; time: number; venue: number };
type Raw = Record<string, string | null> & { confidence: Conf };
type Stage = "idle" | "selected" | "extracting" | "review" | "error";
const STEPS = ["Reading your poster...", "Finding event details...", "Preparing your calendar event..."];
const LOW = 0.7;

const Field = ({ label, warn, children }: { label: string; warn?: boolean; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="mb-1 flex items-center gap-1 font-medium text-stone-700">{label}
      {warn && <span className="flex items-center gap-1 text-xs font-normal text-amber-700"><AlertTriangle size={12} aria-hidden />Please verify</span>}</span>
    {children}
  </label>
);
const inp = "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10";

export default function App() {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [ev, setEv] = useState<CalendarEvent>({ name: "", date: "", startTime: "" });
  const [conf, setConf] = useState<Conf | null>(null);
  const [copied, setCopied] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  const url = useMemo(() => buildCalendarUrl(ev), [ev]);
  const missing = missingFields(ev);
  const set = (k: keyof CalendarEvent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEv((p) => ({ ...p, [k]: e.target.value }));
  const fail = (m: string) => { setError(m); setStage("error"); };

  function choose(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return fail("Unsupported format. Use JPG, PNG or WEBP.");
    if (f.size > 10 * 1024 * 1024) return fail("Image is larger than 10 MB.");
    setFile(f); setPreview(URL.createObjectURL(f)); setStage("selected"); setError("");
  }

  async function extract() {
    if (!file) return fail("Please select a poster image first.");
    setStage("extracting"); setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 2)), 2500);
    try {
      const body = new FormData(); body.append("image", await shrink(file));
      const res = await fetch("/api/extract-event", { method: "POST", body });
      const data = await res.json();
      if (!data.success) return fail(data.error);
      const r: Raw = data.event;
      setEv({ name: r.event_name ?? "", date: r.start_date ?? "", startTime: r.start_time ?? "", endDate: r.end_date ?? "", endTime: r.end_time ?? "",
        timezone: r.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, venue: r.venue ?? "", address: r.address ?? "", description: r.description ?? "", organizer: r.organizer ?? "", url: r.url ?? "" });
      setConf(r.confidence); setStage("review");
    } catch { fail("Network problem. Check your connection and try again."); } finally { clearInterval(t); }
  }

  async function copy() { if (!url) return; await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  const reset = () => { setStage("idle"); setFile(null); setPreview(""); };
  const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition active:scale-[.98]";
  const primary = `${btn} bg-stone-900 text-white shadow-lg shadow-stone-900/20 hover:-translate-y-0.5 hover:bg-stone-800`;
  const secondary = `${btn} border border-stone-300 bg-white hover:bg-stone-100`;

  return (
    <div className="relative min-h-screen overflow-hidden" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}>
      <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -left-24 -top-24 h-80 w-80 animate-[blob_14s_ease-in-out_infinite] rounded-full bg-indigo-300/40 blur-3xl" /><div className="absolute -right-20 top-40 h-72 w-72 animate-[blob_18s_ease-in-out_infinite] rounded-full bg-rose-300/40 blur-3xl" /><div className="absolute bottom-0 left-1/3 h-72 w-72 animate-[blob_16s_ease-in-out_infinite] rounded-full bg-amber-200/50 blur-3xl" /></div>
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2 text-lg font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-rose-500 text-white"><CalendarDays size={18} /></span>Snap2Cal</a>
        <nav className="flex items-center gap-5 text-sm"><a href="#how" className="text-stone-600 hover:text-stone-900">How it works</a>
          <button onClick={() => pick.current?.click()} className="hidden rounded-lg bg-stone-900 px-4 py-2 text-white sm:block">Upload Poster</button></nav>
      </header>
      <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => choose(e.target.files?.[0])} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => choose(e.target.files?.[0])} />

      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-20">
        {(stage === "idle" || stage === "error") && (
          <section className="animate-[fade_.4s] py-12 text-center">
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">AI-powered event extraction</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Turn Event Posters Into <span className="grad">Calendar Events</span></h1>
            <p className="mx-auto mt-4 max-w-lg text-stone-600">Snap or upload a poster. Snap2Cal automatically extracts the date, time, venue and event details and creates a ready-to-use Google Calendar event.</p>
            {stage === "error" && <p role="alert" className="mx-auto mt-6 max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            {stage === "error" && file && <div className="mt-3 flex justify-center gap-4 text-sm"><button className="underline" onClick={extract}>Try again</button><button className="underline" onClick={() => { setConf(null); setStage("review"); }}>Enter details manually</button></div>}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button className={primary} onClick={() => pick.current?.click()}><Upload size={18} />Upload Poster</button>
              <button className={secondary} onClick={() => cam.current?.click()}><Camera size={18} />Capture Poster</button>
            </div>
            <p className="mt-3 text-xs text-stone-500">or drop an image here · JPG, PNG, WEBP up to 10 MB</p>
            <Hero3D />
            <p className="mt-10 text-xs text-stone-500">Your poster is processed to extract event information. We do not need access to your Google Calendar account.</p>
          </section>
        )}

        {stage === "selected" && (
          <section className="py-8 text-center">
            <img src={preview} alt="Selected event poster preview" className="mx-auto max-h-[420px] rounded-xl border border-white shadow-2xl shadow-stone-900/20 animate-[rise_.5s]" />
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button className={primary} onClick={extract}>Extract Event</button>
              <button className={secondary} onClick={() => pick.current?.click()}>Change Image</button>
            </div>
          </section>
        )}

        {stage === "extracting" && (
          <section className="py-16 text-center" aria-live="polite">
            <div className="relative mx-auto mb-8 w-44 overflow-hidden rounded-xl border border-white shadow-2xl shadow-indigo-500/30"><img src={preview} alt="" className="block w-full" /><div className="scan" /></div>
            <p className="text-lg font-medium">{STEPS[step]}</p>
            <div className="mx-auto mt-5 h-1 w-56 overflow-hidden rounded bg-stone-200"><div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded bg-stone-900" /></div>
          </section>
        )}

        {stage === "review" && (
          <section className="py-8">
            <h2 className="text-2xl font-semibold">Review your event</h2>
            {conf && conf.overall < LOW && <p className="mt-2 text-sm text-amber-800">Some details were hard to read. Fields marked “Please verify” need a check.</p>}
            <div className="mt-5 animate-[rise_.5s] space-y-4 rounded-2xl border border-white bg-white/80 p-5 shadow-xl shadow-stone-900/5 backdrop-blur">
              <Field label="Event name" warn={!!conf && conf.event_name < LOW}><input className={inp} value={ev.name} onChange={set("name")} /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date" warn={!ev.date || (!!conf && conf.date < LOW)}><input type="date" className={inp} value={ev.date} onChange={set("date")} /></Field>
                <Field label="Start time" warn={!ev.startTime || (!!conf && conf.time < LOW)}><input type="time" className={inp} value={ev.startTime} onChange={set("startTime")} /></Field>
                <Field label="End time"><input type="time" className={inp} value={ev.endTime ?? ""} onChange={set("endTime")} /></Field>
              </div>
              <Field label="Timezone"><input className={inp} value={ev.timezone ?? ""} onChange={set("timezone")} placeholder="Asia/Kolkata" /></Field>
              <Field label="Venue" warn={!!conf && conf.venue < LOW}><input className={inp} value={ev.venue ?? ""} onChange={set("venue")} /></Field>
              <Field label="Address"><input className={inp} value={ev.address ?? ""} onChange={set("address")} /></Field>
              <Field label="Organizer"><input className={inp} value={ev.organizer ?? ""} onChange={set("organizer")} /></Field>
              <Field label="Website"><input className={inp} value={ev.url ?? ""} onChange={set("url")} /></Field>
              <Field label="Description"><textarea rows={3} className={inp} value={ev.description ?? ""} onChange={set("description")} /></Field>
            </div>
            {missing.length > 0 && <p role="alert" className="mt-4 text-sm text-amber-800">Some event details couldn't be detected. Please complete them before continuing: {missing.join(", ")}.</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!url} onClick={(e) => !url && e.preventDefault()}
                className={`${primary} flex-1 ${!url ? "pointer-events-none opacity-40" : ""}`}><CalendarPlus size={18} />Add to Google Calendar</a>
              <button className={secondary} disabled={!url} onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Calendar link copied" : "Copy Calendar Link"}</button>
            </div>
            <button onClick={reset} className="mt-4 text-sm text-stone-500 underline">Start over</button>
          </section>
        )}

        {(stage === "idle" || stage === "error") && (
          <section id="how" className="border-t border-stone-200 pt-10">
            <h2 className="text-center text-xl font-semibold">How it works</h2>
            <ol className="mt-6 grid gap-6 sm:grid-cols-3">
              {[["01", "Upload", "Upload or capture an event poster."], ["02", "Extract", "Gemini AI identifies the event details."], ["03", "Add to Calendar", "Review the information and add it to Google Calendar."]].map(([n, t, d]) => (
                <li key={n}><span className="text-sm text-stone-400">{n}</span><h3 className="font-medium">{t}</h3><p className="text-sm text-stone-600">{d}</p></li>))}
            </ol>
          </section>
        )}
      </main>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1}}@keyframes slide{0%{margin-left:-33%}100%{margin-left:100%}}`}</style>
    </div>
  );
}
