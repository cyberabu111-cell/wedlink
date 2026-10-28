import { z } from "zod";
import type { VenueEvent, WeddingData } from "@/types/wedding";

const text = z.string().max(20_000);
const shortText = z.string().max(200);
const date = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const webUrl = z.url().refine((value) => /^https?:\/\//.test(value), "Use an HTTP or HTTPS URL");
const draftDate = z.union([z.literal(""), date]);
const draftTime = z.union([z.literal(""), time]);
const draftUrl = z.union([z.literal(""), webUrl]);

export const venueEventSchema = z.object({
  id: z.string().min(1).max(100),
  eventName: shortText,
  date: draftDate,
  startTime: draftTime,
  endTime: draftTime,
  venueName: shortText,
  venueAddress: z.string().max(2_000),
  googlePlaceId: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  googleMapsUrl: draftUrl,
  dressCode: shortText.optional(),
}).strict().superRefine((event, ctx) => {
  if ((event.lat === undefined) !== (event.lng === undefined)) {
    ctx.addIssue({ code: "custom", path: ["lat"], message: "Provide both latitude and longitude" });
  }
});

/** Draft validation: empty content is allowed while editing; unknown keys are rejected. */
export const weddingDataSchema = z.object({
  couple: z.object({
    brideName: shortText,
    groomName: shortText,
    brideBio: text.optional(),
    groomBio: text.optional(),
    hashtag: shortText.optional(),
    weddingDate: draftDate,
    coverPhotoUrl: draftUrl,
  }).strict(),
  story: z.object({
    title: shortText,
    content: text,
    milestones: z.array(z.object({
      year: shortText,
      title: shortText,
      description: text,
    }).strict()).max(100).optional(),
  }).strict(),
  events: z.array(venueEventSchema).max(50).refine(
    (events) => new Set(events.map((event) => event.id)).size === events.length,
    "Event IDs must be unique",
  ),
  gallery: z.array(webUrl).max(200),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontFamily: z.enum(["serif", "sans", "playfair"]),
    backgroundMusicUrl: draftUrl.optional(),
  }).strict(),
  rsvpConfig: z.object({
    enabled: z.boolean(),
    deadline: draftDate.optional(),
    askDietaryPreference: z.boolean(),
    whatsappNumber: z.string().regex(/^(?:\+?[1-9]\d{6,14})?$/).optional(),
  }).strict(),
  sections: z.object({
    showCountdown: z.boolean().optional(),
    showStory: z.boolean().optional(),
    showGallery: z.boolean().optional(),
    showEvents: z.boolean().optional(),
    showRsvp: z.boolean().optional(),
    showMusic: z.boolean().optional(),
  }).strict().optional(),
}).strict();

// These assertions fail compilation if the schema and blueprint diverge in either direction.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
export type WeddingContractCheck = Assert<Same<z.infer<typeof weddingDataSchema>, WeddingData>>;
export type VenueContractCheck = Assert<Same<z.infer<typeof venueEventSchema>, VenueEvent>>;
