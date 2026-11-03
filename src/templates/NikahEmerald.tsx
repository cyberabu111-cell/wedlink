"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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

function downloadICS(title: string, desc: string, location: string, dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const startISO = d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const endISO = new Date(d.getTime() + 3 * 3600 * 1000).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NikahEmerald//Invitation//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${location}`,
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function NikahEmerald({ data, weddingId = "wedding", isPreview }: WeddingTemplateProps) {
  const { couple, story, events, gallery, rsvpConfig, sections } = data;
  const showCoverPhoto = sections?.showCoverPhoto !== false;
  const showCountdown = sections?.showCountdown !== false;
  const showStory = sections?.showStory !== false;
  const showGallery = sections?.showGallery !== false;
  const showEvents = sections?.showEvents !== false;
  const showRsvp = sections?.showRsvp !== false && Boolean(rsvpConfig?.enabled !== false);
  const [blessingCount, setBlessingCount] = useState(0);
  const heartContainerRef = useRef<HTMLDivElement>(null);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: "0",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const target = couple.weddingDate ? new Date(couple.weddingDate).getTime() : new Date("2026-10-22T09:30:00+05:30").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        });
      } else {
        setTimeLeft({ days: "0", hours: "00", minutes: "00", seconds: "00" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [couple.weddingDate]);

  // Floating hearts animation
  const handleBlessingClick = () => {
    setBlessingCount((prev) => prev + 1);

    if (!heartContainerRef.current) return;
    const container = heartContainerRef.current;

    for (let i = 0; i < 5; i++) {
      const heart = document.createElement("span");
      heart.innerText = "❤";
      heart.className = "absolute text-red-500 text-lg select-none pointer-events-none transition-all duration-1000 ease-out";
      const randomX = Math.random() * 80 + 10;
      heart.style.left = `${randomX}%`;
      heart.style.bottom = "20%";
      heart.style.opacity = "1";
      heart.style.transform = `translateY(0) scale(${Math.random() * 0.6 + 0.8})`;

      container.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.transform = "translateY(-140px) scale(1.4)";
        heart.style.opacity = "0";
      });

      setTimeout(() => {
        heart.remove();
      }, 1000);
    }
  };

  const formattedDate = useMemo(() => formatDate(couple.weddingDate), [couple.weddingDate]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059]/20 selection:text-[#775A19] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-[#C5A059]/15 rounded-full blur-[120px]" />
        <div className="absolute top-[45%] -left-32 w-80 h-80 bg-[#c0ecd9]/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[130px]" />
      </div>

      {/* SECTION 1: HERO & INVOCATION */}
      <section className="flex flex-col items-center px-4 pt-10 pb-12 text-center relative max-w-xl mx-auto animate-fade-in-up">
        {/* Bismillah Arabic Calligraphy */}
        <div className="flex flex-col items-center gap-1 mb-4 animate-fade-in-down">
          <span className="text-[#0F382A] text-2xl md:text-3xl tracking-widest font-serif leading-relaxed drop-shadow-[0_1px_3px_rgba(15,56,42,0.15)] select-none">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </span>
          <p className="text-[10px] uppercase text-[#775a19] tracking-widest font-semibold opacity-90">
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>

        {/* Royal Arabesque Motif Divider */}
        <div className="flex flex-col items-center justify-center w-full max-w-xs my-2 text-[#C5A059] animate-fade-in">
          <div className="flex items-center justify-center gap-2 w-full">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059] to-[#C5A059]" />
            <span className="text-xs tracking-widest select-none">❀ ✤ ❀</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059] to-[#C5A059]" />
          </div>
          <div className="flex items-center justify-center gap-1 text-[#775a19]/80 text-[10px] mt-1 select-none uppercase tracking-widest font-semibold">
            <span>✦ Jasmine &amp; Marigold Toran ✦</span>
          </div>
        </div>

        {/* Editorial Couple Announcement */}
        <div className="flex flex-col items-center mt-4 mb-6">
          <h1 className="text-3xl md:text-5xl text-[#1C1A17] tracking-tight font-serif font-bold">
            {couple.groomName}
          </h1>
          <span className="text-xl italic text-[#775a19] my-1 font-serif">&amp;</span>
          <h1 className="text-3xl md:text-5xl text-[#1C1A17] tracking-tight font-serif font-bold">
            {couple.brideName}
          </h1>
          <p className="text-xs text-[#5a544b] max-w-xs mt-3 font-light leading-relaxed">
            Together with their families request the honor of your presence to celebrate their holy union
          </p>
        </div>

        {/* Moorish Arch Portrait Frame */}
        {showCoverPhoto && (
          <div className="relative w-full max-w-[310px] aspect-[4/5] p-2 bg-gradient-to-b from-[#C5A059]/40 via-[#C5A059]/20 to-[#C5A059]/10 rounded-t-[10rem] rounded-b-xl shadow-[0_16px_40px_rgba(197,160,89,0.18)] border border-[#C5A059]/40 backdrop-blur-sm hover-lift transition-all duration-500">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#FAF5EC] border border-[#C5A059]/40 px-3 py-0.5 rounded-full shadow-sm text-[#0F382A] font-serif text-[11px] select-none tracking-wide animate-float-gentle">
              <span className="text-xs text-[#C5A059]">🌸</span>
              <span>Jasmine Garland Swag</span>
              <span className="text-xs text-[#C5A059]">🌸</span>
            </div>

            <div className="relative w-full h-full rounded-t-[9.75rem] rounded-b-lg overflow-hidden bg-[#F3EFE6] shadow-inner ring-1 ring-[#C5A059]/30 group">
              {couple.coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={couple.coverPhotoUrl}
                  alt={`${couple.groomName} and ${couple.brideName}`}
                  className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#8e786b] tracking-wider uppercase font-serif">
                  <span className="text-3xl mb-1 text-[#C5A059]">🕌</span>
                  <span>Arch Portrait</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/30 via-transparent to-transparent opacity-60" />
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-[#C5A059] shadow-md border border-[#C5A059]/30">
                <span className="text-sm text-[#0F382A]">♥</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Countdown Floating Pill */}
        {showCountdown && (
        <div className="w-full max-w-xs mt-6 bg-white/95 backdrop-blur-md rounded-full px-4 py-3 shadow-[0_10px_30px_rgba(197,160,89,0.15)] border border-[#C5A059]/30 hover-lift transition-all">
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col">
              <span className="text-lg text-[#0F382A] font-bold">{timeLeft.days}</span>
              <span className="text-[9px] text-[#5a544b] uppercase tracking-wider font-semibold">Days</span>
            </div>
            <span className="text-[#C5A059]/50 pb-1 font-light">|</span>
            <div className="flex flex-col">
              <span className="text-lg text-[#0F382A] font-bold">{timeLeft.hours}</span>
              <span className="text-[9px] text-[#5a544b] uppercase tracking-wider font-semibold">Hrs</span>
            </div>
            <span className="text-[#C5A059]/50 pb-1 font-light">|</span>
            <div className="flex flex-col">
              <span className="text-lg text-[#0F382A] font-bold">{timeLeft.minutes}</span>
              <span className="text-[9px] text-[#5a544b] uppercase tracking-wider font-semibold">Min</span>
            </div>
            <span className="text-[#C5A059]/50 pb-1 font-light">|</span>
            <div className="flex flex-col">
              <span className="text-lg text-[#0F382A] font-bold">{timeLeft.seconds}</span>
              <span className="text-[9px] text-[#5a544b] uppercase tracking-wider font-semibold">Sec</span>
            </div>
          </div>
        </div>
        )}
      </section>

      {/* SECTION 2: QURANIC VERSE BANNER */}
      <section className="px-4 my-4 max-w-xl mx-auto">
        <RevealOnScroll direction="up" className="relative w-full rounded-2xl bg-[#F4F8F5] border border-[#3e6657]/20 p-6 shadow-[0_12px_32px_rgba(15,56,42,0.06)] overflow-hidden text-center flex flex-col items-center hover-lift transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#C5A059]/15 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#c0ecd9]/40 rounded-full blur-2xl" />

          <div className="flex items-center justify-center gap-2 mb-2 text-[#C5A059]">
            <span className="text-sm">🌸</span>
            <span className="text-xl text-[#0F382A]">🌿</span>
            <span className="text-sm">🌸</span>
          </div>

          <p className="text-[#0F382A] text-lg md:text-xl font-serif leading-loose mb-3 tracking-wide px-2 text-center drop-shadow-sm select-none font-medium">
            وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
          </p>

          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent my-1" />

          <p className="text-xs text-[#1C1A17]/80 italic font-normal max-w-sm mt-2 leading-relaxed">
            “And among His signs is that He created for you mates from among yourselves, that you may dwell in peace with them, and He put between you love and mercy.”
          </p>
          <span className="text-[10px] uppercase tracking-widest text-[#775a19] mt-2 font-semibold">
            Surah Ar-Rum • 30:21
          </span>
        </RevealOnScroll>
      </section>

      {/* SECTION 3: FAMILIES & LINEAGE */}
      <section className="px-4 py-6 flex flex-col items-center max-w-xl mx-auto">
        <RevealOnScroll direction="up" className="flex flex-col items-center mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#775a19] font-semibold">Alhamdulillah</span>
          <h2 className="text-2xl text-[#1C1A17] font-serif mt-1 font-bold">Families &amp; Lineage</h2>
          <div className="flex items-center gap-2 mt-2 text-[#C5A059]">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#C5A059]" />
            <span className="text-xs">❀ ✤ ❀</span>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#C5A059]" />
          </div>
        </RevealOnScroll>

        <div className="flex flex-col w-full gap-4">
          {/* Groom Card */}
          <RevealOnScroll direction="up" delay={50} className="relative w-full bg-white text-[#1C1A17] rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)] border border-[#C5A059]/30 flex flex-col items-center text-center hover-lift transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EC] text-[#0F382A] flex items-center justify-center mb-2 shadow-sm border border-[#C5A059]/20 font-bold">
              👤
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#775a19] font-bold">Groom</span>
            <h3 className="text-xl text-[#1C1A17] mt-1 font-serif font-semibold">{couple.groomName}</h3>
            {couple.groomBio && (
              <p className="text-xs text-[#775a19] mt-1 tracking-wide">
                {couple.groomBio}
              </p>
            )}
          </RevealOnScroll>

          {/* Bride Card */}
          <RevealOnScroll direction="up" delay={150} className="relative w-full bg-white text-[#1C1A17] rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)] border border-[#C5A059]/30 flex flex-col items-center text-center hover-lift transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EC] text-[#0F382A] flex items-center justify-center mb-2 shadow-sm border border-[#C5A059]/20 font-bold">
              🧕
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#775a19] font-bold">Bride</span>
            <h3 className="text-xl text-[#1C1A17] mt-1 font-serif font-semibold">{couple.brideName}</h3>
            {couple.brideBio && (
              <p className="text-xs text-[#775a19] mt-1 tracking-wide">
                {couple.brideBio}
              </p>
            )}
          </RevealOnScroll>
        </div>
      </section>

      
      {/* SECTION: OUR STORY & MILESTONES (NIKAH) */}
      {showStory && story?.content && (
        <section className="px-4 py-8 flex flex-col items-center max-w-xl mx-auto">
          <RevealOnScroll direction="up" className="w-full bg-white rounded-2xl p-6 shadow-sm border border-[#C5A059]/30 text-center">
            <span className="text-xl">❦</span>
            <h2 className="text-xl text-[#0F382A] font-serif font-bold mt-1">
              {story.title || "Our Journey"}
            </h2>
            <p className="text-xs text-[#5a544b] leading-relaxed mt-3 whitespace-pre-line text-left md:text-center">
              {story.content}
            </p>
            {story.milestones && story.milestones.length > 0 && (
              <div className="mt-6 border-t border-[#C5A059]/20 pt-4 space-y-3 text-left">
                {story.milestones.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="font-bold text-[#775a19] min-w-[45px]">{m.year}</span>
                    <div>
                      <strong className="text-[#1C1A17]">{m.title}</strong>
                      {m.description && <p className="text-[#5a544b] mt-0.5">{m.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RevealOnScroll>
        </section>
      )}

      {/* SECTION 4: CEREMONIES & CELEBRATIONS */}
      {showEvents && events && events.length > 0 && (
        <section className="px-4 py-8 flex flex-col items-center max-w-xl mx-auto">
          <RevealOnScroll direction="up" className="flex flex-col items-center mb-6 text-center">
            <span className="text-[10px] uppercase tracking-widest text-[#775a19] font-semibold">Program Schedule</span>
            <h2 className="text-2xl text-[#1C1A17] font-serif mt-1 font-bold">Ceremony &amp; Celebrations</h2>
            <div className="flex items-center gap-2 mt-2 text-[#C5A059]">
              <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#C5A059]" />
              <span className="text-xs">❀ 🕌 ❀</span>
              <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#C5A059]" />
            </div>
          </RevealOnScroll>

          <div className="flex flex-col w-full gap-5">
            {events.map((evt, idx) => (
              <RevealOnScroll
                key={evt.id}
                direction="up"
                delay={idx * 100}
                className="w-full bg-white rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)] border border-[#C5A059]/30 flex flex-col relative overflow-hidden hover-lift transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF5EC] text-[#775a19] border border-[#C5A059]/30 text-[10px] uppercase tracking-wider font-semibold">
                    {idx === 0 ? "Sacred Solemnization" : "Grand Celebration"}
                  </span>
                  <span className="text-sm text-[#C5A059]">✨</span>
                </div>

                <h3 className="text-xl text-[#0F382A] font-serif font-bold mt-1">
                  {evt.eventName}
                </h3>

                <div className="flex flex-col gap-2 my-4 text-xs text-[#5a544b]">
                  {evt.date && (
                    <div className="flex items-center gap-2 text-[#1C1A17]">
                      <span className="text-[#C5A059]">📅</span>
                      <span className="font-medium">{formatDate(evt.date)}</span>
                    </div>
                  )}
                  {evt.startTime && (
                    <div className="flex items-center gap-2 text-[#1C1A17]">
                      <span className="text-[#C5A059]">⏰</span>
                      <span>{evt.startTime} {evt.endTime ? `– ${evt.endTime}` : "IST"}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-[#1C1A17]">
                    <span className="text-[#C5A059]">📍</span>
                    <span>{evt.venueName}{evt.venueAddress ? `, ${evt.venueAddress}` : ""}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FAF5EC]">
                  <GoogleMapCard event={evt} />
                  <AddToCalendarButton
                    event={evt}
                    brideName={couple.brideName}
                    groomName={couple.groomName}
                    weddingId={weddingId}
                    isPreview={isPreview}
                  />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: INTERACTIVE BLESSINGS WIDGET */}
      <section className="px-4 py-8 max-w-xl mx-auto">
        <RevealOnScroll direction="scale" className="relative w-full rounded-2xl bg-white border border-[#C5A059]/40 p-6 text-center flex flex-col items-center shadow-[0_16px_40px_rgba(197,160,89,0.14)] overflow-hidden hover-lift transition-all">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#C5A059]/15 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#c0ecd9]/30 rounded-full blur-xl" />
          <div ref={heartContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

          <span className="text-3xl mb-1 text-[#0F382A]">🤲</span>
          <h3 className="text-xl text-[#1C1A17] font-serif font-bold">
            Written in the Stars, Blessed by Allah
          </h3>
          <p className="text-xs text-[#5a544b] max-w-xs mt-1 mb-4 leading-relaxed">
            Touch below to offer your silent prayers and warmest blessings for their journey ahead
          </p>

          {/* Interactive Mabrook Button */}
          <button
            type="button"
            onClick={handleBlessingClick}
            className="group relative active:scale-95 transition-transform flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#C5A059] text-[#1C1A17] text-sm shadow-[0_8px_24px_rgba(197,160,89,0.3)] hover:bg-[#d6af66] font-bold cursor-pointer tap-bounce"
          >
            <span className="text-red-600 transition-transform group-hover:scale-125">❤</span>
            <span>Send Warm Blessings</span>
            <span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              Mabrook
            </span>
          </button>

          {/* Dynamic Counter Badge */}
          <div className="inline-flex items-center gap-1.5 mt-4 text-[#0F382A] text-xs bg-[#FAF5EC] border border-[#C5A059]/30 px-4 py-1.5 rounded-full shadow-sm hover-lift">
            {blessingCount > 0 ? (
              <>
                <span className="font-bold text-[#775a19]">{blessingCount}</span>
                <span className="opacity-90">{blessingCount === 1 ? "Heartfelt Blessing Sent" : "Heartfelt Blessings Sent"}</span>
              </>
            ) : (
              <span className="opacity-90 font-medium">Tap above to offer your blessings</span>
            )}
          </div>
        </RevealOnScroll>
      </section>

      
      
      {/* SECTION: PHOTO GALLERY (NIKAH) */}
      {showGallery && gallery && gallery.length > 0 && (
        <section className="px-4 py-8 flex flex-col items-center max-w-xl mx-auto">
          <RevealOnScroll direction="up" className="w-full text-center">
            <span className="text-[10px] uppercase tracking-widest text-[#775a19] font-semibold">Captured Moments</span>
            <h2 className="text-2xl text-[#1C1A17] font-serif mt-1 font-bold">Photo Gallery</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {gallery.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-[#C5A059]/20 hover-lift transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Memory ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </section>
      )}

      {/* RSVP SECTION */}
      {showRsvp && (
        <section className="px-4 py-8 flex flex-col items-center max-w-xl mx-auto text-center">
          <RevealOnScroll direction="up" className="w-full bg-white rounded-2xl p-6 shadow-sm border border-[#C5A059]/30">
            <span className="text-xl">✉</span>
            <h2 className="text-xl text-[#0F382A] font-serif font-bold mt-1">Join the Celebration</h2>
            {rsvpConfig.deadline && (
              <p className="text-xs uppercase tracking-wider text-[#775a19] mt-1">
                Kindly respond by {formatDate(rsvpConfig.deadline)}
              </p>
            )}
            <div className="mt-4 flex flex-col items-center gap-2">
              {rsvpConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! I would love to RSVP for ${couple.brideName} & ${couple.groomName}'s wedding!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full text-white text-xs font-semibold tracking-wider uppercase bg-[#0F382A] hover:bg-[#154d3a] shadow-md transition-all duration-300"
                >
                  RSVP via WhatsApp
                </a>
              ) : isPreview ? (
                <p className="text-xs text-[#775a19]">
                  Add your WhatsApp number in the <strong>RSVP &amp; URL</strong> tab to enable guest responses.
                </p>
              ) : null}
            </div>
          </RevealOnScroll>
        </section>
      )}

      {/* SECTION 6: SACRED FOOTER & DUA */}
      <footer className="flex flex-col items-center text-center px-4 pt-6 pb-12 bg-[#FAF8F5] max-w-xl mx-auto">
        {/* Traditional Islamic Wedding Dua */}
        <div className="max-w-md flex flex-col items-center gap-2 mb-6">
          <span className="text-[#0F382A] text-xl md:text-2xl font-serif tracking-wider leading-relaxed drop-shadow-sm select-none font-medium">
            بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
          </span>
          <p className="text-xs text-[#5a544b] italic font-light leading-relaxed px-2">
            “Barakallahu laka wa baraka ‘alayka wa jama‘a baynakuma fee khayr”
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#775a19] font-semibold">
            May Allah bless you, shower His blessings upon you, and unite you both in goodness
          </p>
        </div>

        {/* Elegant Gold Divider */}
        <div className="flex items-center justify-center gap-2 w-44 my-2 text-[#C5A059]">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-[#C5A059]/60" />
          <span className="text-xs">❀ ✤ ❀</span>
          <div className="h-[1px] w-full bg-gradient-to-l from-transparent to-[#C5A059]/60" />
        </div>

        {/* Wedding Tag & Location */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-sm text-[#1C1A17] tracking-widest uppercase font-semibold">
            {couple.hashtag || `#${(couple.groomName || "Groom").split(" ")[0]}Weds${(couple.brideName || "Bride").split(" ")[0]}`}
          </p>
          <span className="text-[10px] tracking-widest text-[#775a19] uppercase font-medium">
            {events?.[0]?.venueAddress ? `${events[0].venueAddress} • ` : ""}{formattedDate}
          </span>
        </div>
      </footer>
    </div>
  );
}
