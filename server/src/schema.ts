import { z } from "zod";
const s = z.string().trim().min(1).nullable().catch(null);
const n = z.number().min(0).max(1).catch(0);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null);
const time = z.string().regex(/^\d{2}:\d{2}$/).nullable().catch(null);
export const EventSchema = z.object({
  is_event_poster: z.boolean().catch(true),
  event_name: s, description: s, start_date: date, start_time: time, end_date: date, end_time: time,
  timezone: s, venue: s, address: s, organizer: s, url: s, category: s,
  confidence: z.object({ overall: n, event_name: n, date: n, time: n, venue: n }).catch({ overall: 0, event_name: 0, date: 0, time: 0, venue: 0 }),
});
export type EventData = z.infer<typeof EventSchema>;
