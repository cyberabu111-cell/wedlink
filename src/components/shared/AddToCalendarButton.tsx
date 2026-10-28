"use client";

import React, { useState } from "react";
import type { VenueEvent } from "@/types/wedding";
import { downloadIcsFile, generateGoogleCalendarUrl, getEventTimeRange } from "@/utils/calendar";

interface Props {
  event: VenueEvent;
  brideName: string;
  groomName: string;
  weddingId: string;
  isPreview?: boolean;
}

export function AddToCalendarButton({ event, brideName, groomName, weddingId, isPreview }: Props) {
  const [error, setError] = useState("");
  const url = generateGoogleCalendarUrl(event, brideName, groomName);
  if (!url) return isPreview ? <p className="event-calendar-note">Add a valid date and different start/end times to enable calendar links.</p> : null;
  const range = getEventTimeRange(event)!;
  return (
    <div className="event-calendar">
      <p className="event-calendar-note">India Standard Time{range.overnight ? " · Ends the following day" : ""}</p>
      <details>
        <summary className="event-action">Add to calendar <span aria-hidden="true">+</span></summary>
        <div className="event-calendar-options">
          <a className="event-action" href={url} target="_blank" rel="noopener noreferrer">Google Calendar ↗</a>
          <button className="event-action" type="button" onClick={() => {
            try { downloadIcsFile(event, brideName, groomName, weddingId); setError(""); }
            catch { setError("The download could not start. Please try again or use Google Calendar."); }
          }}>Apple / Outlook (.ics) ↓</button>
        </div>
      </details>
      {error && <p role="alert" className="event-calendar-note">{error}</p>}
    </div>
  );
}
