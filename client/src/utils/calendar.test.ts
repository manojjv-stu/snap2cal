import { describe, it, expect } from "vitest";
import { buildCalendarUrl, missingFields, addHour } from "./calendar";

const base = { name: "Tech Fest & Expo", date: "2026-10-15", startTime: "10:00", endTime: "13:00", timezone: "Asia/Kolkata", venue: "RV College", address: "Bengaluru" };

describe("calendar url", () => {
  it("keeps local time and sets ctz", () => {
    const u = new URL(buildCalendarUrl(base)!);
    expect(u.searchParams.get("dates")).toBe("20261015T100000/20261015T130000");
    expect(u.searchParams.get("ctz")).toBe("Asia/Kolkata");
    expect(u.searchParams.get("location")).toBe("RV College, Bengaluru");
  });
  it("encodes special characters", () => {
    const url = buildCalendarUrl(base)!;
    expect(url).toContain("text=Tech+Fest+%26+Expo");
    expect(new URL(url).searchParams.get("text")).toBe("Tech Fest & Expo");
  });
  it("defaults end to +1h, crossing midnight", () => {
    expect(addHour("2026-12-31", "23:30")).toEqual(["2027-01-01", "00:30"]);
    expect(new URL(buildCalendarUrl({ ...base, endTime: "" })!).searchParams.get("dates")).toBe("20261015T100000/20261015T110000");
  });
  it("reports missing required fields and returns null", () => {
    const e = { ...base, name: "", date: "", startTime: "" };
    expect(missingFields(e)).toEqual(["Event name", "Date", "Start time"]);
    expect(buildCalendarUrl(e)).toBeNull();
  });
  it("rejects malformed dates", () => expect(buildCalendarUrl({ ...base, date: "15/10/2026" })).toBeNull());
});
