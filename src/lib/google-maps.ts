"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export function loadPlacesLibrary(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (!configured) {
    setOptions({ key: apiKey, v: "quarterly", region: "IN" });
    configured = true;
  }
  return importLibrary("places");
}
