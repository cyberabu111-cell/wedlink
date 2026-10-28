export interface VenueEvent {
  id: string;
  eventName: string;          // e.g., "Haldi Ceremony", "Sangeet", "Muhurtham"
  date: string;               // ISO Date "2026-12-14"
  startTime: string;          // "10:00" (24h format for Calendar calculation)
  endTime: string;            // "14:00"
  venueName: string;          // e.g., "Taj Falaknuma Palace"
  venueAddress: string;       // Full address populated via Google Places
  googlePlaceId?: string;     // Place ID for accurate Maps Embed
  lat?: number;               // Latitude for Maps pin
  lng?: number;               // Longitude for Maps pin
  googleMapsUrl: string;      // Direct navigation link for guests
  dressCode?: string;         // e.g., "Traditional Yellow"
}

export interface WeddingData {
  couple: {
    brideName: string;
    groomName: string;
    brideBio?: string;
    groomBio?: string;
    hashtag?: string;         // e.g., "#RahulKiPriya"
    weddingDate: string;      // Primary countdown date
    coverPhotoUrl: string;
  };
  story: {
    title: string;
    content: string;
    milestones?: Array<{ year: string; title: string; description: string }>;
  };
  events: VenueEvent[];
  gallery: string[];          // Array of compressed WebP image URLs
  theme: {
    primaryColor: string;     // Hex code e.g., "#8B0000"
    secondaryColor: string;   // Hex code e.g., "#D4AF37"
    fontFamily: 'serif' | 'sans' | 'playfair';
    backgroundMusicUrl?: string;
  };
  rsvpConfig: {
    enabled: boolean;
    deadline?: string;
    askDietaryPreference: boolean;
    whatsappNumber?: string;  // Optional: also send RSVP via WhatsApp
  };
}
