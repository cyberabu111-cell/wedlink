import type { VenueEvent } from "@/types/wedding";

/** Derived from the master contract; this is not a second persisted data model. */
export type VenueSelection = Required<Pick<VenueEvent,
  "venueName" | "venueAddress" | "googlePlaceId" | "lat" | "lng" | "googleMapsUrl"
>>;

export function venueLocationText(event: VenueEvent): string {
  return [event.venueName.trim(), event.venueAddress.trim()].filter(Boolean).join(", ");
}

function coordinates(event: VenueEvent): string | null {
  const { lat, lng } = event;
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180
    ? `${lat},${lng}` : null;
}

function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && url.href.length <= 2048
      ? url.href : null;
  } catch { return null; }
}

/** Official universal directions URL; never asks the application for guest location. */
export function getDirectionsUrl(event: VenueEvent): string | null {
  const location = venueLocationText(event);
  const point = coordinates(event);
  const placeId = event.googlePlaceId?.trim();
  if (placeId || point) {
    const params = new URLSearchParams({ api: "1", destination: point || location || placeId! });
    if (placeId) params.set("destination_place_id", placeId);
    return `https://www.google.com/maps/dir/?${params}`;
  }
  const manualUrl = safeWebUrl(event.googleMapsUrl);
  // Ignore the generic Maps homepage used by older sample drafts.
  if (manualUrl && !/^https?:\/\/(?:maps\.google\.com|www\.google\.com\/maps)\/?$/.test(manualUrl)) {
    return manualUrl;
  }
  if (!location) return null;
  const url = `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: location })}`;
  return url.length <= 2048 ? url : null;
}

export function getMapEmbedUrl(event: VenueEvent, apiKey?: string): string | null {
  if (!apiKey?.trim()) return null;
  const query = event.googlePlaceId?.trim()
    ? `place_id:${event.googlePlaceId.trim()}`
    : coordinates(event) || venueLocationText(event);
  if (!query) return null;
  return `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: apiKey.trim(), q: query })}`;
}

/** Manual address edits must not leave an old pin attached to a different venue. */
export function updateVenueText(event: VenueEvent, field: "venueName" | "venueAddress", value: string): VenueEvent {
  const updated = { ...event, [field]: value, googlePlaceId: undefined, lat: undefined, lng: undefined, googleMapsUrl: "" };
  return { ...updated, googleMapsUrl: getDirectionsUrl(updated) || "" };
}
