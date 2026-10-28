"use client";

import React, { useMemo } from "react";
import type { TemplateProps } from "./index";
import { GoogleMapCard } from "@/components/shared/GoogleMapCard";
import { AddToCalendarButton } from "@/components/shared/AddToCalendarButton";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BohoFloral({ data, weddingId, isPreview }: TemplateProps) {
  const { couple, story, events, gallery, theme, rsvpConfig } = data;
  const primary = theme?.primaryColor || "#c86d51";
  const secondary = theme?.secondaryColor || "#e29578";

  const formattedDate = useMemo(() => formatDate(couple.weddingDate), [couple.weddingDate]);

  return (
    <div
      className="@container min-h-screen text-[#3d2c29] bg-[#fbf7f4] selection:bg-[#f6dfd7] selection:text-[#5a2a1d]"
      style={{
        fontFamily: theme?.fontFamily === "sans" ? "sans-serif" : "Georgia, serif",
      }}
    >
      {/* Decorative Floral Header Motif */}
      <div className="w-full text-center py-3 text-xs tracking-[0.2em] uppercase font-serif text-[#9b6f63] bg-[#f5ebe6] border-b border-[#ebd7ce]">
        🌸 We are getting married 🌸
      </div>

      {/* HERO SECTION */}
      <section className="px-6 py-16 text-center max-w-3xl mx-auto">
        {couple.hashtag && (
          <span className="inline-block px-4 py-1 text-xs tracking-wider uppercase rounded-full bg-[#f6ded6] text-[#8e4530] mb-6 font-sans font-medium">
            {couple.hashtag}
          </span>
        )}

        <p className="text-xs uppercase tracking-[0.25em] text-[#937167] mb-2 font-sans">
          Together with their families
        </p>

        <h1 className="text-4xl @3xl:text-6xl font-normal leading-tight text-[#47251c]">
          {couple.brideName || "Bride"}
          <span className="block my-2 text-3xl font-serif italic text-[#c86d51]">and</span>
          {couple.groomName || "Groom"}
        </h1>

        {formattedDate && (
          <div className="mt-6 inline-block px-6 py-2 rounded-full bg-white border border-[#edd7cd] shadow-sm text-sm text-[#7e4f43]">
            {formattedDate}
          </div>
        )}

        {/* Cover Photo */}
        {couple.coverPhotoUrl ? (
          <div className="mt-10 mx-auto max-w-md p-3 bg-white rounded-3xl shadow-lg border border-[#f0ded5]">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#faeee8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={couple.coverPhotoUrl}
                alt={`${couple.brideName} & ${couple.groomName}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="mt-10 mx-auto max-w-md aspect-[4/5] rounded-3xl border-2 border-dashed border-[#e3c7ba] bg-white/60 flex flex-col items-center justify-center text-xs text-[#a37e72] tracking-wider uppercase font-sans">
            Couple Photo
          </div>
        )}

        {/* Bios */}
        {(couple.brideBio || couple.groomBio) && (
          <div className="mt-12 grid @3xl:grid-cols-2 gap-6 text-left">
            {couple.brideBio && (
              <div className="p-6 rounded-2xl bg-white/90 border border-[#edd6cc] shadow-sm">
                <span className="text-xs uppercase tracking-wider font-sans font-semibold text-[#b85b3f]">The Bride</span>
                <p className="text-sm mt-2 leading-relaxed text-[#593d36]">{couple.brideBio}</p>
              </div>
            )}
            {couple.groomBio && (
              <div className="p-6 rounded-2xl bg-white/90 border border-[#edd6cc] shadow-sm">
                <span className="text-xs uppercase tracking-wider font-sans font-semibold text-[#b85b3f]">The Groom</span>
                <p className="text-sm mt-2 leading-relaxed text-[#593d36]">{couple.groomBio}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* OUR STORY */}
      {story?.content && (
        <section className="px-6 py-16 bg-[#f7ede7] border-y border-[#ebd5cb]">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl text-[#462820]">
              {story.title || "How It All Began"}
            </h2>
            <p className="mt-6 text-sm leading-8 text-[#5a3f38] whitespace-pre-line text-left @3xl:text-center">
              {story.content}
            </p>

            {story.milestones && story.milestones.length > 0 && (
              <div className="mt-10 space-y-4 text-left">
                {story.milestones.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-[#ead4ca] shadow-sm">
                    <span className="text-xs font-sans font-bold text-[#b4563a] uppercase">{m.year}</span>
                    <h4 className="font-semibold text-sm text-[#3b2723] mt-0.5">{m.title}</h4>
                    <p className="text-xs text-[#6e5048] mt-1">{m.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* EVENTS */}
      {events && events.length > 0 && (
        <section className="px-6 py-20 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] font-sans font-medium text-[#a06859]">Timeline</span>
            <h2 className="text-3xl @3xl:text-4xl mt-1 text-[#42261f]">The Celebration</h2>
          </div>

          <div className="grid @3xl:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-6 rounded-3xl bg-white border border-[#eedad0] shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-normal text-[#3f241d]">{event.eventName}</h3>
                  {event.startTime && (
                    <span className="text-xs font-sans px-3 py-1 rounded-full bg-[#fbf1ec] text-[#934a34] font-medium border border-[#ebd2c7]">
                      {event.startTime} {event.endTime ? `– ${event.endTime}` : ""}
                    </span>
                  )}
                </div>

                {event.date && (
                  <p className="text-xs font-sans uppercase tracking-wider text-[#9b6656] mt-2 font-medium">
                    {formatDate(event.date)}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-[#f7e8e1] text-xs space-y-1 text-[#563c35]">
                  <p className="font-semibold text-sm text-[#381f18]">{event.venueName}</p>
                  {event.venueAddress && <p className="text-[#6d4f47] leading-relaxed">{event.venueAddress}</p>}
                  {event.dressCode && (
                    <p className="pt-2 text-[#7f5144]">
                      <span className="font-semibold">Attire:</span> {event.dressCode}
                    </p>
                  )}
                  <GoogleMapCard event={event} />
                    <AddToCalendarButton event={event} brideName={couple.brideName} groomName={couple.groomName} weddingId={weddingId} isPreview={isPreview} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery && gallery.length > 0 && (
        <section className="px-6 py-16 bg-[#f8efe9] border-t border-[#ecd7cd]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl text-[#46271f] mb-8">Captured Moments</h2>
            <div className="grid grid-cols-2 @3xl:grid-cols-3 gap-4">
              {gallery.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-[#ebd4c9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      {rsvpConfig?.enabled && (
        <section className="px-6 py-20 text-center max-w-md mx-auto">
          <span className="text-2xl">🌿</span>
          <h2 className="text-2xl @3xl:text-3xl mt-2 text-[#44251e]">Celebrate With Us</h2>
          {rsvpConfig.deadline && (
            <p className="text-xs uppercase font-sans tracking-wider text-[#8b594b] mt-2">
              Please RSVP by {formatDate(rsvpConfig.deadline)}
            </p>
          )}

          <div className="mt-8">
            {rsvpConfig.whatsappNumber ? (
              <a
                href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hi!%20I%20will%20be%20attending%20the%20wedding!`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-full text-white text-xs font-sans font-semibold tracking-wider uppercase shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: primary }}
              >
                RSVP via WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled={isPreview}
                className="px-8 py-3 rounded-full text-white text-xs font-sans font-semibold tracking-wider uppercase shadow-md"
                style={{ backgroundColor: primary }}
              >
                {isPreview ? "RSVP (Active upon publish)" : "Send RSVP"}
              </button>
            )}
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-xs uppercase font-sans tracking-widest text-[#936d62] border-t border-[#edd9cf]">
        {couple.brideName} & {couple.groomName} · All My Love
      </footer>
    </div>
  );
}
