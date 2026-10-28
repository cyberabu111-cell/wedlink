"use client";

import { useEffect, useId, useRef, useState } from "react";
import { loadPlacesLibrary } from "@/lib/google-maps";
import type { VenueSelection } from "@/utils/maps";

interface Props {
  onSelectVenue: (venue: VenueSelection) => void;
  /** Changes when the owner manually edits the location; cancel stale pending selections. */
  locationRevision: string;
}

export default function VenueLocationPicker({ onSelectVenue, locationRevision }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hostRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectVenue);
  const requestRef = useRef(0);
  const id = useId();
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "selecting" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => { onSelectRef.current = onSelectVenue; }, [onSelectVenue]);
  useEffect(() => { requestRef.current += 1; }, [locationRevision]);

  useEffect(() => {
    if (!active || !apiKey || !hostRef.current) return;
    const host = hostRef.current;
    let disposed = false;
    let widget: google.maps.places.PlaceAutocompleteElement | undefined;
    let timedOut = false;
    setStatus("loading");
    setMessage("");
    const fail = () => {
      if (disposed) return;
      setStatus("error");
      setMessage("Venue search is unavailable. Retry or enter the venue details below.");
    };
    const timer = window.setTimeout(() => { timedOut = true; fail(); }, 15_000);

    const select: EventListener = async (event) => {
      const request = ++requestRef.current;
      setStatus("selecting");
      setMessage("Getting venue details…");
      const detailTimer = window.setTimeout(() => {
        if (!disposed && request === requestRef.current) { requestRef.current += 1; fail(); }
      }, 15_000);
      try {
        const { placePrediction } = event as google.maps.places.PlacePredictionSelectEvent;
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
        if (disposed || request !== requestRef.current) return;
        if (!place.location || !place.id || !place.formattedAddress) throw new Error("Incomplete venue");
        const lat = place.location.lat();
        const lng = place.location.lng();
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          throw new Error("Invalid coordinates");
        }
        const venueName = place.displayName || "";
        const venueAddress = place.formattedAddress;
        const params = new URLSearchParams({
          api: "1", destination: `${lat},${lng}`, destination_place_id: place.id,
        });
        onSelectRef.current({
          venueName, venueAddress, googlePlaceId: place.id, lat, lng,
          googleMapsUrl: `https://www.google.com/maps/dir/?${params}`,
        });
        setStatus("ready");
        setMessage("Venue selected. Check the details below, then save your draft.");
      } catch {
        if (!disposed && request === requestRef.current) fail();
      } finally { window.clearTimeout(detailTimer); }
    };

    void loadPlacesLibrary(apiKey).then(({ PlaceAutocompleteElement }) => {
      if (disposed || timedOut) return;
      window.clearTimeout(timer);
      widget = new PlaceAutocompleteElement();
      widget.setAttribute("aria-label", "Search for a wedding venue");
      widget.setAttribute("aria-describedby", id);
      widget.addEventListener("gmp-select", select);
      widget.addEventListener("gmp-error", fail);
      host.replaceChildren(widget);
      setStatus("ready");
    }).catch(fail);

    return () => {
      disposed = true;
      requestRef.current += 1;
      window.clearTimeout(timer);
      widget?.removeEventListener("gmp-select", select);
      widget?.removeEventListener("gmp-error", fail);
      widget?.remove();
    };
  }, [active, apiKey, attempt, id]);

  if (!apiKey) return <p className="venue-picker-note">Enter the venue and address below. Google venue search will be available once Maps is configured.</p>;

  return (
    <div className="venue-picker">
      <p className="venue-picker-title">Find your venue</p>
      {!active ? <button type="button" className="event-action" onClick={() => setActive(true)}>Search Google Maps ↗</button> : (
        <>
          <div ref={hostRef} className="venue-search-host" />
          {status === "loading" && <p role="status" className="venue-picker-note">Loading venue search…</p>}
          {status === "error" && <button type="button" className="event-action" onClick={() => setAttempt((value) => value + 1)}>Retry search</button>}
        </>
      )}
      <p id={id} className="venue-picker-note" role="status" aria-live="polite">
        {message || "Select a suggestion to fill the address and map pin. You can also enter the details manually."}
      </p>
    </div>
  );
}
