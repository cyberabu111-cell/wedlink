import React from "react";
import type { VenueEvent } from "@/types/wedding";
import { getDirectionsUrl, getMapEmbedUrl } from "@/utils/maps";

export function GoogleMapCard({ event }: { event: VenueEvent }) {
  const directions = getDirectionsUrl(event);
  const embed = getMapEmbedUrl(event, process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  if (!embed && !directions) return null;
  return (
    <div className="event-map-card">
      {embed && <iframe title={`Map for ${event.eventName || "celebration"} at ${event.venueName || "the venue"}`}
        src={embed} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      {directions && <a className="event-action" href={directions} target="_blank" rel="noopener noreferrer">
        Get directions <span aria-hidden="true">↗</span>
      </a>}
    </div>
  );
}
