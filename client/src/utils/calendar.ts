export interface CalendarEvent { name: string; date: string; startTime: string; endDate?: string; endTime?: string; timezone?: string; venue?: string; address?: string; description?: string; organizer?: string; url?: string }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const compact = (d: string, t: string) => `${d.replaceAll("-", "")}T${t.replace(":", "")}00`;

/** Adds one hour to a local date+time without any timezone conversion. */
export function addHour(date: string, time: string): [string, string] {
  const d = new Date(`${date}T${time}:00Z`);
  d.setUTCHours(d.getUTCHours() + 1);
  const iso = d.toISOString();
  return [iso.slice(0, 10), iso.slice(11, 16)];
}

export function missingFields(e: CalendarEvent): string[] {
  const m: string[] = [];
  if (!e.name.trim()) m.push("Event name");
  if (!DATE.test(e.date)) m.push("Date");
  if (!TIME.test(e.startTime)) m.push("Start time");
  return m;
}

export function buildCalendarUrl(e: CalendarEvent): string | null {
  if (missingFields(e).length) return null;
  const [ed, et] = e.endTime && TIME.test(e.endTime) ? [e.endDate && DATE.test(e.endDate) ? e.endDate : e.date, e.endTime] : addHour(e.date, e.startTime);
  const details = [e.description, e.organizer && `Organizer: ${e.organizer}`, e.url && `Link: ${e.url}`].filter(Boolean).join("\n\n");
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.name.trim(), dates: `${compact(e.date, e.startTime)}/${compact(ed, et)}` });
  if (e.timezone) p.set("ctz", e.timezone);
  if (details) p.set("details", details);
  const loc = [e.venue, e.address].filter(Boolean).join(", ");
  if (loc) p.set("location", loc);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
