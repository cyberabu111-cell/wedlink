"use client";

import React, { useMemo } from "react";
import type { WeddingTemplateProps } from "@/types/wedding";
import { GoogleMapCard } from "@/components/shared/GoogleMapCard";
import { AddToCalendarButton } from "@/components/shared/AddToCalendarButton";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function MinimalSage({ data, weddingId = "wedding", isPreview }: WeddingTemplateProps) {
  const { couple, story, events, gallery, theme, rsvpConfig, sections } = data;
  const showCoverPhoto = sections?.showCoverPhoto !== false;
  const showStory = sections?.showStory !== false;
  const showGallery = sections?.showGallery !== false;
  const showEvents = sections?.showEvents !== false;
  const showRsvp = sections?.showRsvp !== false && Boolean(rsvpConfig?.enabled !== false);
  const primary = theme?.primaryColor || "#385144";
  const secondary = theme?.secondaryColor || "#738b77";

  const formattedDate = useMemo(() => formatDate(couple.weddingDate), [couple.weddingDate]);

  return (
    <div
      className="@container min-h-screen text-[#262c28] bg-[#f5f6f4] selection:bg-[#d8e2dc] selection:text-[#1c2e24]"
      style={{
        fontFamily: theme?.fontFamily === "playfair" ? "Georgia, serif" : theme?.fontFamily === "serif" ? "serif" : "sans-serif",
      }}
    >
      {/* Top Subtle Bar */}
      <div className="w-full text-center py-2 text-[10px] tracking-[0.3em] uppercase text-[#67776b] border-b border-[#e1e5e0] animate-fade-in-down">
        Wedding Invitation
      </div>

      {/* HERO SECTION */}
      <section className="px-6 pt-16 pb-20 max-w-3xl mx-auto text-center animate-fade-in-up">
        {couple.hashtag && (
          <p className="text-xs tracking-[0.25em] uppercase text-[#697a6d] mb-6 animate-float-gentle inline-block">
            {couple.hashtag}
          </p>
        )}

        <h1 className="text-4xl @3xl:text-6xl font-light tracking-tight text-[#1e2722] leading-tight">
          {couple.brideName || "Bride"}
          <span className="inline-block mx-3 text-2xl font-serif italic text-[#647c6b]">&</span>
          {couple.groomName || "Groom"}
        </h1>

        {formattedDate && (
          <p className="mt-6 text-sm tracking-[0.2em] uppercase text-[#556959] font-medium">
            {formattedDate}
          </p>
        )}

        {/* Minimalist Cover Photo */}
        {showCoverPhoto && (couple.coverPhotoUrl ? (
          <div className="mt-12 mx-auto max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-[#e8ece7] shadow-sm hover-lift transition-all duration-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={couple.coverPhotoUrl}
              alt={`${couple.brideName} & ${couple.groomName}`}
              className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
            />
          </div>
        ) : isPreview ? (
          <div className="mt-12 mx-auto max-w-md aspect-[3/4] rounded-2xl border border-dashed border-[#ccd4cb] bg-white/50 flex flex-col items-center justify-center text-xs text-[#829285] tracking-widest uppercase hover-lift">
            Photograph
          </div>
        ) : null)}

        {/* Bios */}
        {(couple.brideBio || couple.groomBio) && (
          <RevealOnScroll direction="up" delay={150} className="mt-14 grid @3xl:grid-cols-2 gap-8 text-left max-w-xl mx-auto">
            {couple.brideBio && (
              <div className="border-l-2 border-[#b5c5b8] pl-4 hover-lift transition-all">
                <span className="text-xs uppercase tracking-wider text-[#637968] font-semibold">The Bride</span>
                <p className="text-sm mt-1 leading-relaxed text-[#414e44]">{couple.brideBio}</p>
              </div>
            )}
            {couple.groomBio && (
              <div className="border-l-2 border-[#b5c5b8] pl-4 hover-lift transition-all">
                <span className="text-xs uppercase tracking-wider text-[#637968] font-semibold">The Groom</span>
                <p className="text-sm mt-1 leading-relaxed text-[#414e44]">{couple.groomBio}</p>
              </div>
            )}
          </RevealOnScroll>
        )}
      </section>

      {/* OUR STORY */}
      {showStory && story?.content && (
        <section className="px-6 py-20 bg-white border-y border-[#e5eae3]">
          <RevealOnScroll direction="up" className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl @3xl:text-3xl font-light text-[#202923]">
              {story.title || "The Story"}
            </h2>
            <div className="w-10 h-px bg-[#8fa492] mx-auto my-6" />
            <p className="text-sm leading-8 text-[#4a584e] whitespace-pre-line text-left @3xl:text-center">
              {story.content}
            </p>

            {story.milestones && story.milestones.length > 0 && (
              <div className="mt-12 border-t border-[#edf1eb] pt-8 space-y-6 text-left">
                {story.milestones.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-[60px_1fr] gap-4 items-baseline hover-lift p-2 rounded-lg transition-all">
                    <span className="text-xs font-mono text-[#637c68] font-semibold">{m.year}</span>
                    <div>
                      <h4 className="text-sm font-medium text-[#222b25]">{m.title}</h4>
                      <p className="text-xs text-[#5f7063] mt-1">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RevealOnScroll>
        </section>
      )}

      {/* EVENTS */}
      {showEvents && events && events.length > 0 && (
        <section className="px-6 py-20 max-w-2xl mx-auto">
          <RevealOnScroll direction="up" className="text-center mb-14">
            <h2 className="text-2xl @3xl:text-3xl font-light text-[#222c25]">
              Celebrations & Itinerary
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#728575] mt-2">Where & When</p>
          </RevealOnScroll>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-[#d6ded5]">
            {events.map((event, idx) => (
              <RevealOnScroll key={event.id} direction="up" delay={idx * 100} className="relative pl-10">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#52796f] ring-4 ring-[#f5f6f4] animate-pulse-glow" />

                <div className="p-6 rounded-xl bg-white border border-[#e1e7e0] shadow-sm hover-lift transition-all duration-300">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-medium text-[#1e2721]">{event.eventName}</h3>
                    {event.startTime && (
                      <span className="text-xs text-[#526a57] font-mono">
                        {event.startTime} {event.endTime ? `– ${event.endTime}` : ""}
                      </span>
                    )}
                  </div>

                  {event.date && (
                    <p className="text-xs text-[#708474] mt-1 tracking-wider uppercase font-medium">
                      {formatDate(event.date)}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#eff3ee] text-xs text-[#4b5a4f] space-y-1">
                    <p className="font-medium text-[#222b25]">{event.venueName}</p>
                    {event.venueAddress && <p className="text-[#65796a]">{event.venueAddress}</p>}
                    {event.dressCode && (
                      <p className="pt-2 text-[#465a4c]">
                        <span className="font-semibold">Attire:</span> {event.dressCode}
                      </p>
                    )}
                    <GoogleMapCard event={event} />
                    <AddToCalendarButton event={event} brideName={couple.brideName} groomName={couple.groomName} weddingId={weddingId} isPreview={isPreview} />
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {showGallery && gallery && gallery.length > 0 && (
        <section className="px-6 py-16 bg-white border-t border-[#e2e8e0]">
          <div className="max-w-4xl mx-auto text-center">
            <RevealOnScroll direction="up">
              <h2 className="text-2xl font-light text-[#222a24] mb-8">Memories</h2>
            </RevealOnScroll>
            <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-3">
              {gallery.map((url, i) => (
                <RevealOnScroll key={i} direction="scale" delay={i * 70} className="aspect-[4/5] rounded-lg overflow-hidden bg-[#eff3ee] hover-lift group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      {showRsvp && (
        <section className="px-6 py-20 text-center max-w-md mx-auto">
          <RevealOnScroll direction="up">
            <h2 className="text-2xl font-light text-[#222a24]">Join Us</h2>
            {rsvpConfig.deadline && (
              <p className="text-xs text-[#6e8272] uppercase tracking-wider mt-2">
                Kindly respond by {formatDate(rsvpConfig.deadline)}
              </p>
            )}

            <div className="mt-8">
              {rsvpConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hi!%20I%20will%20be%20attending%20the%20wedding!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 rounded-lg text-white text-xs font-semibold tracking-widest uppercase transition-all duration-300 shadow-sm hover:scale-105 hover:shadow-md tap-bounce"
                  style={{ backgroundColor: primary }}
                >
                  Confirm Attendance
                </a>
              ) : isPreview ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Add your WhatsApp number in the <strong>RSVP &amp; URL</strong> tab to enable guest responses.
                </p>
              ) : null}
            </div>
          </RevealOnScroll>
        </section>
      )}

      <footer className="py-8 text-center text-[11px] tracking-widest uppercase text-[#7f9082] border-t border-[#e3e8e1]">
        {couple.brideName} & {couple.groomName}
      </footer>
    </div>
  );
}
