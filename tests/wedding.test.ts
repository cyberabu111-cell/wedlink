import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmptyWeddingData } from "../src/lib/wedding-defaults";
import { weddingDataSchema } from "../src/lib/validation/wedding";

test("blank drafts are complete and independently mutable", () => {
  const first = createEmptyWeddingData();
  const second = createEmptyWeddingData();
  assert.equal(weddingDataSchema.safeParse(first).success, true);
  first.couple.brideName = "Amina";
  assert.equal(second.couple.brideName, "");
});

test("reject invalid dates, unsafe URLs and extra data fields", () => {
  const draft = createEmptyWeddingData();
  assert.equal(weddingDataSchema.safeParse({ ...draft, paymentStatus: "paid" }).success, false);
  assert.equal(weddingDataSchema.safeParse({ ...draft, couple: { ...draft.couple, weddingDate: "2026-02-30" } }).success, false);
  assert.equal(weddingDataSchema.safeParse({ ...draft, gallery: ["javascript:alert(1)"] }).success, false);
});

test("reject duplicate event IDs and incomplete coordinates", () => {
  const event = { id: "nikah", eventName: "Nikah", date: "2026-12-14", startTime: "10:00", endTime: "12:00", venueName: "Hall", venueAddress: "Thrissur", googleMapsUrl: "https://maps.google.com/" };
  assert.equal(weddingDataSchema.safeParse({ ...createEmptyWeddingData(), events: [event] }).success, true);
  assert.equal(weddingDataSchema.safeParse({ ...createEmptyWeddingData(), events: [event, event] }).success, false);
  assert.equal(weddingDataSchema.safeParse({ ...createEmptyWeddingData(), events: [{ ...event, lat: 10 }] }).success, false);
});


test("section visibility flags are valid and optional in weddingDataSchema", () => {
  const draft = createEmptyWeddingData();
  assert.equal(weddingDataSchema.safeParse(draft).success, true);
  assert.equal(draft.sections?.showCoverPhoto, true);
  assert.equal(draft.sections?.showCouplePhotos, true);
  assert.equal(draft.sections?.showCountdown, true);
  assert.equal(draft.sections?.showStory, true);
  assert.equal(draft.sections?.showGallery, true);
  assert.equal(draft.sections?.showEvents, true);
  assert.equal(draft.sections?.showRsvp, true);
  assert.equal(draft.sections?.showMusic, true);

  // Custom section visibility
  const custom = {
    ...draft,
    couple: {
      ...draft.couple,
      bridePhoto: "https://example.com/bride.jpg",
      groomPhoto: "https://example.com/groom.jpg",
    },
    sections: {
      showCoverPhoto: false,
      showCouplePhotos: false,
      showCountdown: false,
      showStory: false,
      showGallery: false,
      showEvents: true,
      showRsvp: false,
      showMusic: false,
    },
  };
  const parseResult = weddingDataSchema.safeParse(custom);
  assert.equal(parseResult.success, true);
  if (parseResult.success) {
    assert.equal(parseResult.data.couple.bridePhoto, "https://example.com/bride.jpg");
    assert.equal(parseResult.data.couple.groomPhoto, "https://example.com/groom.jpg");
    assert.equal(parseResult.data.sections?.showCoverPhoto, false);
    assert.equal(parseResult.data.sections?.showCouplePhotos, false);
  }

  // Schema allows omitting sections (backward-compatible)
  const { sections, ...withoutSections } = draft;
  assert.equal(weddingDataSchema.safeParse(withoutSections).success, true);
});
