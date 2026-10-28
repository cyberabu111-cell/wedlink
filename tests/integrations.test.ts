import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { VenueEvent } from "../src/types/wedding";
import { getEventTimeRange, generateGoogleCalendarUrl, generateIcsContent } from "../src/utils/calendar";
import { getDirectionsUrl, getMapEmbedUrl, updateVenueText } from "../src/utils/maps";
import { createEmptyWeddingData } from "../src/lib/wedding-defaults";
import { weddingDataSchema } from "../src/lib/validation/wedding";
import { TEMPLATE_REGISTRY } from "../src/templates";

const event: VenueEvent = {
  id: "ceremony-1", eventName: "Wedding", date: "2026-12-14",
  startTime: "10:00", endTime: "14:00", venueName: "Palace & Gardens",
  venueAddress: "Hyderabad, India", googleMapsUrl: "",
};

test("calendar uses explicit UTC instants for IST, independent of host timezone", () => {
  const range = getEventTimeRange(event)!;
  assert.equal(range.start.toISOString(), "2026-12-14T04:30:00.000Z");
  assert.equal(range.end.toISOString(), "2026-12-14T08:30:00.000Z");
  const url = new URL(generateGoogleCalendarUrl(event, "Priya & Co", "Rahul")!);
  assert.equal(url.searchParams.get("dates"), "20261214T043000Z/20261214T083000Z");
  assert.equal(url.searchParams.get("ctz"), "Asia/Kolkata");
  assert.match(url.searchParams.get("text")!, /Priya & Co & Rahul/);
  assert.equal(url.searchParams.get("location"), "Palace & Gardens, Hyderabad, India");
});

test("overnight events cross month, leap-day and year boundaries correctly", () => {
  for (const [date, end] of [
    ["2026-12-31", "2027-01-01T01:30:00.000Z"],
    ["2028-02-28", "2028-02-29T01:30:00.000Z"],
    ["2028-02-29", "2028-03-01T01:30:00.000Z"],
  ]) {
    const range = getEventTimeRange({ ...event, date, startTime: "23:30", endTime: "07:00" })!;
    assert.equal(range.end.toISOString(), end);
    assert.equal(range.overnight, true);
    assert.equal(range.end.getTime() - range.start.getTime(), 7.5 * 3_600_000);
  }
  assert.equal(getEventTimeRange({ ...event, startTime: "00:15" })!.start.toISOString(), "2026-12-13T18:45:00.000Z");
});

test("incomplete or impossible schedules cannot generate misleading calendar links", () => {
  for (const patch of [
    { date: "" }, { date: "2026-02-30" }, { date: "2026-13-01" },
    { startTime: "" }, { endTime: "" }, { startTime: "24:00" },
    { endTime: "14:99" }, { endTime: "10:00" },
  ]) {
    const invalid = { ...event, ...patch };
    assert.equal(getEventTimeRange(invalid), null);
    assert.equal(generateGoogleCalendarUrl(invalid, "A", "B"), null);
    assert.equal(generateIcsContent(invalid, "A", "B", "wedding-1"), null);
  }
});

test("ICS is CRLF-delimited, escaped, UTF-8 folded and contains stable identity", () => {
  const tricky = {
    ...event,
    eventName: "വിവാഹം 💐 ".repeat(20),
    venueName: "Hall, One; West\\Wing",
    venueAddress: "Road\r\nBEGIN:VEVENT\nSUMMARY:Injected",
  };
  const now = new Date("2026-10-27T10:00:00Z");
  const content = generateIcsContent(tricky, "പ്രിയ", "രാഹുൽ", "wedding-1", now)!;
  const unfolded = content.replace(/\r\n /g, "");
  assert.ok(content.endsWith("\r\n"));
  assert.equal(content.replace(/\r\n/g, "").includes("\n"), false);
  for (const line of content.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.match(unfolded, /PRODID:/);
  assert.match(unfolded, /DTSTAMP:20261027T100000Z/);
  assert.match(unfolded, /DTSTART:20261214T043000Z/);
  assert.match(unfolded, /DTEND:20261214T083000Z/);
  assert.ok(unfolded.includes("LOCATION:Hall\\, One\\; West\\\\Wing,") === false);
  assert.ok(unfolded.includes("Hall\\, One\\; West\\\\Wing"));
  assert.ok(unfolded.includes("Road\\nBEGIN:VEVENT\\nSUMMARY:Injected"));
  assert.equal(unfolded.split("\r\n").filter((line) => line === "BEGIN:VEVENT").length, 1);
  assert.match(unfolded, /UID:wedding-1.ceremony-1@everafter.invitation/);
  const other = generateIcsContent(event, "A", "B", "wedding-2", now)!;
  assert.match(other, /UID:wedding-2.ceremony-1@everafter.invitation/);
});

test("map URLs encode place IDs and coordinates and fall back to manual locations", () => {
  const located = { ...event, googlePlaceId: "place+id&test", lat: 0, lng: 0 };
  const directions = new URL(getDirectionsUrl(located)!);
  assert.equal(directions.searchParams.get("destination_place_id"), located.googlePlaceId);
  assert.equal(directions.searchParams.get("destination"), "0,0");
  assert.equal(directions.searchParams.get("api"), "1");
  const embed = new URL(getMapEmbedUrl(located, "test-key")!);
  assert.equal(embed.searchParams.get("q"), "place_id:place+id&test");
  assert.equal(getMapEmbedUrl(event, ""), null);
  assert.equal(new URL(getDirectionsUrl(event)!).searchParams.get("destination"), "Palace & Gardens, Hyderabad, India");
  const manual = { ...event, googleMapsUrl: "https://maps.app.goo.gl/example" };
  assert.equal(getDirectionsUrl(manual), manual.googleMapsUrl);
  const blank = { ...event, venueName: "", venueAddress: "", googleMapsUrl: "javascript:alert(1)" };
  assert.equal(getDirectionsUrl(blank), null);
  assert.equal(getMapEmbedUrl(blank, "test-key"), null);
  assert.equal(getDirectionsUrl({ ...blank, lat: NaN, lng: 0 }), null);
});

test("manual location edits invalidate old pins and still satisfy WeddingData", () => {
  const changed = updateVenueText({ ...event, googlePlaceId: "old", lat: 10, lng: 20 }, "venueAddress", "New road");
  assert.equal(changed.googlePlaceId, undefined);
  assert.equal(changed.lat, undefined);
  assert.equal(changed.lng, undefined);
  assert.equal(new URL(changed.googleMapsUrl).searchParams.get("destination"), "Palace & Gardens, New road");
  assert.ok(weddingDataSchema.safeParse({ ...createEmptyWeddingData(), events: [changed] }).success);
});

test("all three templates render accessible event actions and tolerate blank event drafts", () => {
  const data = createEmptyWeddingData();
  data.events = [event];
  for (const Template of Object.values(TEMPLATE_REGISTRY)) {
    const html = renderToStaticMarkup(React.createElement(Template, { data, weddingId: "wedding-1", isPreview: true }));
    assert.match(html, /Get directions/);
    assert.match(html, /Add to calendar/);
    assert.match(html, /calendar.google.com/);
    assert.match(html, /Apple \/ Outlook/);
    const draft = renderToStaticMarkup(React.createElement(Template, {
      data: { ...data, events: [{ ...event, date: "" }] }, weddingId: "wedding-1", isPreview: true,
    }));
    assert.doesNotMatch(draft, /calendar.google.com/);
    assert.match(draft, /Add a valid date/);
  }
});
