import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { WeddingData, WeddingTemplateProps, VenueEvent } from "../src/types/wedding";
import {
  TEMPLATES,
  TEMPLATE_REGISTRY,
  getTemplate,
  getTemplateComponent,
  isRegisteredTemplate,
  TemplateCategory,
} from "../src/templates/registry";
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  getGoogleMapsDirectionUrl,
  EmbeddedMap,
} from "../src/components/shared/WeddingActionHelpers";

test("contract: WeddingTemplateProps conforms to plug-and-play interface", () => {
  const dummyData: WeddingData = {
    couple: {
      brideName: "Priya",
      groomName: "Rahul",
      weddingDate: "2026-12-14",
      coverPhotoUrl: "https://example.com/photo.jpg",
    },
    story: { title: "Our Story", content: "Love story" },
    events: [],
    gallery: [],
    theme: {
      primaryColor: "#8B0000",
      secondaryColor: "#D4AF37",
      fontFamily: "serif",
    },
    rsvpConfig: { enabled: true, askDietaryPreference: false },
  };

  const props: WeddingTemplateProps = {
    data: dummyData,
    isPreview: true,
    onRsvpSubmit: async () => {},
  };

  assert.ok(props.data);
  assert.equal(props.isPreview, true);
  assert.equal(typeof props.onRsvpSubmit, "function");
});

test("registry: all entries contain id, name, category, thumbnailUrl, and component", () => {
  assert.ok(TEMPLATES.length >= 5, "Must have at least 5 templates registered");

  const validCategories: TemplateCategory[] = [
    "Traditional",
    "Minimal",
    "Modern",
    "Floral",
    "Luxury",
  ];

  for (const entry of TEMPLATES) {
    assert.ok(typeof entry.id === "string" && entry.id.length > 0, "id must be non-empty string");
    assert.ok(typeof entry.name === "string" && entry.name.length > 0, "name must be non-empty string");
    assert.ok(validCategories.includes(entry.category), `category ${entry.category} must be one of allowed categories`);
    assert.ok(typeof entry.thumbnailUrl === "string" && entry.thumbnailUrl.startsWith("/thumbs/"), "thumbnailUrl must be valid path");
    assert.ok(entry.component, `component for ${entry.id} must be defined`);
  }
});

test("registry: lookup functions retrieve templates accurately", () => {
  assert.ok(isRegisteredTemplate("royal-rajwada"));
  assert.ok(isRegisteredTemplate("bento-clay"));
  assert.ok(!isRegisteredTemplate("non-existent-template"));

  const bento = getTemplate("bento-clay");
  assert.ok(bento);
  assert.equal(bento.name, "Bento Clay (Terracotta)");
  assert.equal(bento.category, "Modern");

  const royalComp = getTemplateComponent("royal-rajwada");
  assert.ok(royalComp);

  // Fallback to royal-rajwada if template ID is unknown
  const fallbackComp = getTemplateComponent("unknown-template");
  assert.ok(fallbackComp);
});

test("action helpers: getGoogleCalendarUrl builds valid Google Calendar links", () => {
  const event: VenueEvent = {
    id: "evt-1",
    eventName: "Sangeet Night",
    date: "2026-12-14",
    startTime: "18:00",
    endTime: "22:00",
    venueName: "Taj Falaknuma",
    venueAddress: "Engine Bowli, Falaknuma, Hyderabad",
    googleMapsUrl: "",
  };

  const url = getGoogleCalendarUrl(event, { brideName: "Priya", groomName: "Rahul" });
  assert.ok(url.startsWith("https://calendar.google.com/calendar/render?"));
  assert.match(url, /Sangeet\+Night/);
  assert.match(url, /Taj\+Falaknuma/);
  assert.match(url, /ctz=Asia%2FKolkata/);

  // Tolerates blank or partial event gracefully
  const blankUrl = getGoogleCalendarUrl(null);
  assert.equal(blankUrl, "");
});

test("action helpers: downloadIcsFile is safe in server/headless environments", () => {
  const event: VenueEvent = {
    id: "evt-1",
    eventName: "Wedding Ceremony",
    date: "2026-12-14",
    startTime: "10:00",
    endTime: "13:00",
    venueName: "Grand Palace",
    venueAddress: "MG Road, Bengaluru",
    googleMapsUrl: "",
  };

  // In Node.js testing environment (typeof window === 'undefined'), it safely returns false without throwing
  const result = downloadIcsFile(event, { brideName: "Priya", groomName: "Rahul" });
  assert.equal(result, false);
});

test("action helpers: getGoogleMapsDirectionUrl resolves directions from strings, events, and coordinates", () => {
  // 1. From address string
  const strUrl = getGoogleMapsDirectionUrl("Taj Falaknuma Palace, Hyderabad");
  assert.match(strUrl, /https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(strUrl, /Taj%20Falaknuma/);

  // 2. From VenueEvent
  const event: VenueEvent = {
    id: "evt-1",
    eventName: "Muhurtham",
    date: "2026-12-14",
    startTime: "10:00",
    endTime: "12:00",
    venueName: "Leela Palace",
    venueAddress: "Old Airport Road, Bengaluru",
    lat: 12.9606,
    lng: 77.6484,
    googleMapsUrl: "",
  };
  const eventUrl = getGoogleMapsDirectionUrl(event);
  assert.match(eventUrl, /https:\/\/www\.google\.com\/maps\/dir\/\?api=1/);
  assert.match(eventUrl, /destination=12\.9606%2C77\.6484/);

  // 3. Fallback for empty
  assert.equal(getGoogleMapsDirectionUrl(null), "");
});

test("action helpers: EmbeddedMap renders responsive iframe or styled placeholder", () => {
  // With coordinates
  const htmlWithCoords = renderToStaticMarkup(
    React.createElement(EmbeddedMap, {
      lat: 12.9606,
      lng: 77.6484,
      venueName: "Leela Palace",
    })
  );
  assert.match(htmlWithCoords, /<iframe/);
  assert.match(htmlWithCoords, /maps\.google\.com\/maps\?q=12\.9606%2C77\.6484/);
  assert.match(htmlWithCoords, /output=embed/);

  // Without coordinates or address (placeholder)
  const placeholderHtml = renderToStaticMarkup(
    React.createElement(EmbeddedMap, {})
  );
  assert.match(placeholderHtml, /Venue map location pending/);
});
