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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function RoyalRajwada({ data, weddingId = "wedding", isPreview }: WeddingTemplateProps) {
  const { couple, story, events, gallery, theme, rsvpConfig, sections } = data;
  const showStory = sections?.showStory !== false;
  const showGallery = sections?.showGallery !== false;
  const showEvents = sections?.showEvents !== false;
  const showRsvp = sections?.showRsvp !== false && Boolean(rsvpConfig?.enabled !== false);
  const primary = theme?.primaryColor || "#8B0000";
  const secondary = theme?.secondaryColor || "#D4AF37";

  const formattedDate = useMemo(() => formatDate(couple.weddingDate), [couple.weddingDate]);

  return (
    <div
      className="@container min-h-screen text-[#2a1b14] bg-[#faf6f0] selection:bg-[#f3d9b1] selection:text-[#5a1818]"
      style={{
        fontFamily: theme?.fontFamily === "sans" ? "sans-serif" : "serif",
      }}
    >
      {/* Decorative Traditional Indian Arch Banner */}
      <div
        className="w-full text-center py-3 text-xs tracking-[0.25em] uppercase font-semibold border-b animate-fade-in-down"
        style={{
          backgroundColor: primary,
          color: secondary,
          borderColor: secondary,
        }}
      >
        ✦ ॐ श्री गणेशाय नमः · शुभ विवाह ✦
      </div>

      {/* HERO SECTION */}
      <section className="relative px-6 py-16 @3xl:py-24 text-center overflow-hidden">
        {/* Ornate Background Accents */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${primary} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="max-w-3xl mx-auto relative z-10 animate-fade-in-up">
          {couple.hashtag && (
            <span
              className="inline-block px-4 py-1 text-xs tracking-[0.2em] uppercase rounded-full border mb-6 font-medium animate-float-gentle"
              style={{ borderColor: secondary, color: primary, backgroundColor: "#fff9f0" }}
            >
              {couple.hashtag}
            </span>
          )}

          <p className="text-xs uppercase tracking-[0.3em] text-[#7c6354] mb-3">
            With the blessings of our elders
          </p>

          <h1
            className="text-4xl @3xl:text-6xl font-normal tracking-wide leading-tight"
            style={{ color: primary }}
          >
            {couple.brideName || "Bride"}
            <span className="block my-2 text-2xl @3xl:text-3xl italic" style={{ color: secondary }}>
              weds
            </span>
            {couple.groomName || "Groom"}
          </h1>

          {formattedDate && (
            <div className="mt-8 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[#e8d7c3] bg-white/70 shadow-sm text-sm tracking-wider hover-lift">
              <span style={{ color: secondary }}>✦</span>
              <span>{formattedDate}</span>
              <span style={{ color: secondary }}>✦</span>
            </div>
          )}

          {/* Cover Photo */}
          {couple.coverPhotoUrl ? (
            <div className="mt-10 mx-auto max-w-lg p-2 rounded-2xl border-2 shadow-xl bg-white hover-lift transition-all duration-500" style={{ borderColor: secondary }}>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f0eae1] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={couple.coverPhotoUrl}
                  alt={`${couple.brideName} & ${couple.groomName}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          ) : (
            <div className="mt-10 mx-auto max-w-lg p-12 rounded-2xl border-2 border-dashed bg-white/40 flex flex-col items-center justify-center text-center text-[#9b8577] hover-lift transition-all" style={{ borderColor: secondary }}>
              <span className="text-3xl mb-2 animate-pulse-glow" style={{ color: secondary }}>⚜</span>
              <p className="text-xs tracking-wider uppercase">Royal Portrait Placeholder</p>
            </div>
          )}

          {/* Bios */}
          {(couple.brideBio || couple.groomBio) && (
            <RevealOnScroll direction="up" delay={150} className="mt-12 grid @3xl:grid-cols-2 gap-6 text-left">
              {couple.brideBio && (
                <div className="p-6 rounded-xl bg-white/80 border border-[#e8d7c3] shadow-sm hover-lift transition-all duration-300">
                  <h3 className="text-lg font-medium mb-2" style={{ color: primary }}>The Bride</h3>
                  <p className="text-sm leading-relaxed text-[#5c493d]">{couple.brideBio}</p>
                </div>
              )}
              {couple.groomBio && (
                <div className="p-6 rounded-xl bg-white/80 border border-[#e8d7c3] shadow-sm hover-lift transition-all duration-300">
                  <h3 className="text-lg font-medium mb-2" style={{ color: primary }}>The Groom</h3>
                  <p className="text-sm leading-relaxed text-[#5c493d]">{couple.groomBio}</p>
                </div>
              )}
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* OUR STORY */}
      {showStory && story?.content && (
        <section className="px-6 py-16 bg-[#f4ebe1] border-y border-[#e2d2c1]">
          <RevealOnScroll direction="up" className="max-w-2xl mx-auto text-center">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: secondary }}>
              Shubh Aarambh
            </span>
            <h2 className="text-3xl mt-2 mb-6" style={{ color: primary }}>
              {story.title || "Our Story"}
            </h2>
            <p className="text-base leading-relaxed text-[#4d3b31] whitespace-pre-line">
              {story.content}
            </p>

            {/* Milestones */}
            {story.milestones && story.milestones.length > 0 && (
              <div className="mt-12 space-y-6 text-left">
                {story.milestones.map((m, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/90 border border-[#e6d8c8] shadow-sm hover-lift transition-all duration-300">
                    <span className="font-bold text-sm tracking-wider pt-0.5" style={{ color: primary }}>
                      {m.year}
                    </span>
                    <div>
                      <h4 className="font-medium text-sm text-[#2a1b14]">{m.title}</h4>
                      <p className="text-xs text-[#6e5849] mt-1">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RevealOnScroll>
        </section>
      )}

      {/* EVENTS / CEREMONIES */}
      {showEvents && events && events.length > 0 && (
        <section className="px-6 py-20 max-w-4xl mx-auto">
          <RevealOnScroll direction="up" className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: secondary }}>
              Celebration Itinerary
            </span>
            <h2 className="text-3xl @3xl:text-4xl mt-2" style={{ color: primary }}>
              Wedding Ceremonies
            </h2>
          </RevealOnScroll>

          <div className="grid @3xl:grid-cols-2 gap-6">
            {events.map((event, idx) => (
              <RevealOnScroll
                key={event.id}
                direction="up"
                delay={idx * 100}
                className="p-6 rounded-2xl bg-white border shadow-md relative overflow-hidden transition-all duration-300 hover-lift hover:shadow-xl"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: secondary }}
                />
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-medium" style={{ color: primary }}>
                    {event.eventName || "Ceremony"}
                  </h3>
                  {event.startTime && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#faf5ee] border border-[#e4d3bf] font-medium text-[#7a5a41]">
                      {event.startTime} {event.endTime ? `– ${event.endTime}` : ""}
                    </span>
                  )}
                </div>

                {event.date && (
                  <p className="text-xs font-medium text-[#8c6b52] mt-2 tracking-wide uppercase">
                    {formatDate(event.date)}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-[#f2e7db] text-sm">
                  <p className="font-medium text-[#2d1c12]">{event.venueName}</p>
                  {event.venueAddress && (
                    <p className="text-xs text-[#715c4d] mt-1 leading-relaxed">
                      {event.venueAddress}
                    </p>
                  )}
                  {event.dressCode && (
                    <p className="text-xs mt-3 text-[#876a52]">
                      <span className="font-semibold">Dress Code:</span> {event.dressCode}
                    </p>
                  )}
                  <GoogleMapCard event={event} />
                  <AddToCalendarButton event={event} brideName={couple.brideName} groomName={couple.groomName} weddingId={weddingId} isPreview={isPreview} />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {showGallery && gallery && gallery.length > 0 && (
        <section className="px-6 py-16 bg-[#f5ede3] border-t border-[#e2d2c1]">
          <div className="max-w-5xl mx-auto text-center">
            <RevealOnScroll direction="up" className="mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: secondary }}>
                Precious Moments
              </span>
              <h2 className="text-3xl mt-2" style={{ color: primary }}>
                Photo Gallery
              </h2>
            </RevealOnScroll>
            <div className="grid grid-cols-2 @3xl:grid-cols-3 gap-4">
              {gallery.map((url, i) => (
                <RevealOnScroll key={i} direction="scale" delay={i * 80} className="aspect-square rounded-xl overflow-hidden bg-white/70 border shadow-sm group hover-lift" >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP FOOTER */}
      {showRsvp && (
        <section className="px-6 py-20 text-center bg-white border-t border-[#e8d7c3]">
          <RevealOnScroll direction="up" className="max-w-md mx-auto">
            <span className="text-2xl animate-pulse-glow inline-block" style={{ color: secondary }}>⚜</span>
            <h2 className="text-2xl @3xl:text-3xl mt-2" style={{ color: primary }}>
              Will You Grace Us With Your Presence?
            </h2>
            {rsvpConfig.deadline && (
              <p className="text-xs uppercase tracking-wider text-[#826a57] mt-2">
                Kindly respond by {formatDate(rsvpConfig.deadline)}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              {rsvpConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello!%20I%20would%20love%20to%20attend%20the%20wedding!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full text-white text-sm font-semibold tracking-wide shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg tap-bounce"
                  style={{ backgroundColor: primary }}
                >
                  RSVP via WhatsApp
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

      {/* FOOTER */}
      <footer className="py-8 text-center text-xs tracking-widest uppercase border-t border-[#e5d4c0] text-[#8e7564]">
        {couple.brideName} & {couple.groomName} · Forever & Always
      </footer>
    </div>
  );
}
