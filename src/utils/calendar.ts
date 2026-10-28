import type { VenueEvent } from "@/types/wedding";
import { getDirectionsUrl, venueLocationText } from "./maps";

export const EVENT_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** WeddingData has no timezone/end-date fields: all events use IST, with <24h duration. */
export function getEventTimeRange(event: VenueEvent): { start: Date; end: Date; overnight: boolean } | null {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(event.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.endTime) ||
      event.startTime === event.endTime) return null;
  const midnight = Date.parse(`${event.date}T00:00:00Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== event.date) return null;
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const overnight = event.endTime < event.startTime;
  const start = new Date(midnight + minutes(event.startTime) * 60_000 - IST_OFFSET_MS);
  const end = new Date(midnight + minutes(event.endTime) * 60_000 - IST_OFFSET_MS + (overnight ? DAY_MS : 0));
  if (end.getUTCFullYear() > 9999) return null;
  return { start, end, overnight };
}

function calendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function eventTitle(event: VenueEvent, brideName: string, groomName: string): string {
  const names = [brideName.trim(), groomName.trim()].filter(Boolean).join(" & ");
  return `${event.eventName.trim() || "Wedding celebration"}${names ? ` — ${names}'s Wedding` : ""}`;
}

function eventDescription(event: VenueEvent): string {
  return [
    `You are invited to ${event.eventName.trim() || "our wedding celebration"}!`,
    "Event times are in India Standard Time (Asia/Kolkata).",
    event.dressCode ? `Dress code: ${event.dressCode}` : "",
    getDirectionsUrl(event) ? `Directions: ${getDirectionsUrl(event)}` : "",
  ].filter(Boolean).join("\n");
}

export function generateGoogleCalendarUrl(event: VenueEvent, brideName: string, groomName: string): string | null {
  const range = getEventTimeRange(event);
  if (!range) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(event, brideName, groomName),
    dates: `${calendarTimestamp(range.start)}/${calendarTimestamp(range.end)}`,
    details: eventDescription(event),
    location: venueLocationText(event),
    ctz: EVENT_TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Escape TEXT values before line folding, including newline/property injection. */
function escapeIcsText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** RFC 5545: maximum 75 UTF-8 octets per physical line, including continuation space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let part = "";
  let bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) { lines.push(part); part = " "; bytes = 1; }
    part += character;
    bytes += length;
  }
  lines.push(part);
  return lines.join("\r\n");
}

export function generateIcsContent(
  event: VenueEvent, brideName: string, groomName: string, weddingId: string, now = new Date(),
): string | null {
  const range = getEventTimeRange(event);
  if (!range) return null;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Everafter//Wedding Invitation//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${encodeURIComponent(weddingId)}.${encodeURIComponent(event.id)}@everafter.invitation`,
    `DTSTAMP:${calendarTimestamp(now)}`,
    `DTSTART:${calendarTimestamp(range.start)}`,
    `DTEND:${calendarTimestamp(range.end)}`,
    `SUMMARY:${escapeIcsText(eventTitle(event, brideName, groomName))}`,
    `LOCATION:${escapeIcsText(venueLocationText(event))}`,
    `DESCRIPTION:${escapeIcsText(eventDescription(event))}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function downloadIcsFile(event: VenueEvent, brideName: string, groomName: string, weddingId: string): boolean {
  const content = generateIcsContent(event, brideName, groomName, weddingId);
  if (!content) return false;
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "wedding-event"}.ics`;
  document.body.appendChild(link);
  try { link.click(); } finally {
    link.remove();
    // Allow Safari to begin consuming the Blob before revoking it.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  return true;
}
