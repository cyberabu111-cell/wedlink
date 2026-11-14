import FestieRooftop from "@/templates/FestieRooftop";
import type { WeddingData } from "@/types/wedding";

const previewData: WeddingData = {
  couple: {
    brideName: "Nusrath",
    groomName: "Rabiyath",
    weddingDate: "2027-01-24",
    coverPhotoUrl: "/templates/festie-rooftop/rooftop-couple.png",
    hashtag: "#RabiyathWedsNusrath",
    brideBio: "",
    groomBio: "",
  },
  groom: {
    qualification: "B.Tech CSE",
    fatherName: "Koolakkattil Moosa",
    motherName: "Zainaba (Late Chennangadan)",
  },
  bride: {
    qualification: "B.Tech CSE",
    fatherName: "Koolakkattil Moosa",
    motherName: "Zainaba (Late Chennangadan)",
  },
  story: { title: "", content: "" },
  events: [
    {
      id: "nikah-ceremony",
      eventName: "Nikah Ceremony",
      date: "2027-01-24",
      startTime: "",
      endTime: "",
      venueName: "CK Convention",
      venueAddress: "Center Chavakkad",
      googleMapsUrl: "",
    },
  ],
  gallery: [],
  theme: {
    primaryColor: "#ae111a",
    secondaryColor: "#f5d992",
    fontFamily: "serif",
  },
  rsvpConfig: { enabled: false, askDietaryPreference: false },
};

export default function FestieRooftopPreviewPage() {
  return <FestieRooftop data={previewData} weddingId="festie-rooftop-preview" isPreview />;
}
