import React from "react";
import type { VenueEvent } from "@/types/wedding";
import {
  generateGoogleCalendarUrl,
  downloadIcsFile as calendarDownloadIcs,
} from "@/utils/calendar";
import { getDirectionsUrl } from "@/utils/maps";

/**
 * Universal calendar link generator for any wedding template.
 * Formats event times in India Standard Time (Asia/Kolkata) with UTC instants.
 */
export function getGoogleCalendarUrl(
  event?: Partial<VenueEvent> | null,
  couple?: { brideName?: string; groomName?: string } | string
): string {
  if (!event) return "";
  const brideName = typeof couple === "string" ? couple : couple?.brideName || "";
  const groomName = typeof couple === "object" ? couple?.groomName || "" : "";

  const completeEvent: VenueEvent = {
    id: event.id || "event",
    eventName: event.eventName || "Wedding Ceremony",
    date: event.date || "",
    startTime: event.startTime || "10:00",
    endTime: event.endTime || "13:00",
    venueName: event.venueName || "",
    venueAddress: event.venueAddress || "",
    googleMapsUrl: event.googleMapsUrl || "",
    dressCode: event.dressCode || "",
    googlePlaceId: event.googlePlaceId,
    lat: event.lat,
    lng: event.lng,
  };

  const url = generateGoogleCalendarUrl(completeEvent, brideName, groomName);
  if (url) return url;

  // Fallback for partial/draft date schedules
  if (event.date) {
    const title = [
      event.eventName || "Wedding Celebration",
      brideName && groomName ? `— ${brideName} & ${groomName}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const location = [event.venueName, event.venueAddress].filter(Boolean).join(", ");
    const dateCompact = event.date.replace(/-/g, "");
    const dates = `${dateCompact}T043000Z/${dateCompact}T083000Z`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates,
      location,
      ctz: "Asia/Kolkata",
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }
  return "";
}

/**
 * Universal RFC 5545 .ics calendar download for Apple, Outlook, and desktop calendars.
 */
export function downloadIcsFile(
  event?: Partial<VenueEvent> | null,
  couple?: { brideName?: string; groomName?: string } | string,
  weddingId = "wedding"
): boolean {
  if (!event || typeof window === "undefined") return false;
  const brideName = typeof couple === "string" ? couple : couple?.brideName || "";
  const groomName = typeof couple === "object" ? couple?.groomName || "" : "";

  const completeEvent: VenueEvent = {
    id: event.id || "event-1",
    eventName: event.eventName || "Wedding Celebration",
    date: event.date || new Date().toISOString().slice(0, 10),
    startTime: event.startTime || "10:00",
    endTime: event.endTime || "13:00",
    venueName: event.venueName || "",
    venueAddress: event.venueAddress || "",
    googleMapsUrl: event.googleMapsUrl || "",
    dressCode: event.dressCode || "",
    googlePlaceId: event.googlePlaceId,
    lat: event.lat,
    lng: event.lng,
  };

  return calendarDownloadIcs(completeEvent, brideName, groomName, weddingId);
}

/**
 * Universal Google Maps directions URL builder for venue locations.
 * Accepts full VenueEvent, venue object, or raw address string.
 */
export function getGoogleMapsDirectionUrl(
  venue?:
    | string
    | Partial<VenueEvent>
    | {
        venueName?: string;
        venueAddress?: string;
        googlePlaceId?: string;
        lat?: number;
        lng?: number;
        googleMapsUrl?: string;
      }
    | null
): string {
  if (!venue) return "";
  if (typeof venue === "string") {
    const trimmed = venue.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`;
  }

  const directions = getDirectionsUrl(venue as VenueEvent);
  if (directions) return directions;

  const loc = [venue.venueName?.trim(), venue.venueAddress?.trim()].filter(Boolean).join(", ");
  if (loc) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc)}`;
  }

  if (typeof venue.lat === "number" && typeof venue.lng === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
  }

  return "";
}

export interface EmbeddedMapProps {
  lat?: number;
  lng?: number;
  venueName?: string;
  venueAddress?: string;
  googlePlaceId?: string;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Ready-to-use responsive map component for any template.
 * Works with or without NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export function EmbeddedMap({
  lat,
  lng,
  venueName,
  venueAddress,
  googlePlaceId,
  zoom = 15,
  className = "w-full h-64 rounded-xl border border-stone-200 shadow-sm",
  style,
  title,
}: EmbeddedMapProps) {
  const query = googlePlaceId
    ? `place_id:${googlePlaceId}`
    : typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)
    ? `${lat},${lng}`
    : [venueName, venueAddress].filter(Boolean).join(", ");

  if (!query) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 text-stone-400 text-sm ${className}`}
        style={style}
      >
        <span>Venue map location pending</span>
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: apiKey, q: query })}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=${zoom}&output=embed`;

  return (
    <iframe
      title={title || `Map location for ${venueName || "wedding venue"}`}
      src={src}
      className={className}
      style={{ border: 0, ...style }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
