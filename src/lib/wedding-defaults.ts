import type { WeddingData } from "@/types/wedding";

/** Always return fresh nested objects; never share mutable draft state across users. */
export function createEmptyWeddingData(): WeddingData {
  return {
    couple: { brideName: "", groomName: "", weddingDate: "", coverPhotoUrl: "" },
    story: { title: "", content: "" },
    events: [],
    gallery: [],
    theme: { primaryColor: "#8B0000", secondaryColor: "#D4AF37", fontFamily: "serif" },
    rsvpConfig: { enabled: true, askDietaryPreference: false },
  };
}
