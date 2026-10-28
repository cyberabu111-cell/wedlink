"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { TemplateProps } from "./index";
import type { VenueEvent } from "@/types/wedding";
import { GoogleMapCard } from "@/components/shared/GoogleMapCard";
import { getDirectionsUrl } from "@/utils/maps";
import { AddToCalendarButton } from "@/components/shared/AddToCalendarButton";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";

/* ───────────────────────── helpers ───────────────────────── */

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

function formatTime12(time24?: string) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/* ───────────────────────── SVGs ───────────────────────── */

/** Toran / garland decoration for hero card top */
function ToranSVG() {
  return (
    <svg
      className="w-full h-10 drop-shadow-sm opacity-90"
      viewBox="0 0 360 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0 Q 90 26 180 0 Q 270 26 360 0"
        stroke="#a8624c"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <circle cx="45" cy="11" r="5" fill="#e7bea7" />
      <circle cx="45" cy="11" r="3" fill="#8a4b36" />
      <circle cx="90" cy="14" r="6" fill="#ffdbd0" />
      <circle cx="90" cy="14" r="4" fill="#8a4b36" />
      <circle cx="135" cy="11" r="5" fill="#e7bea7" />
      <circle cx="180" cy="5" r="6.5" fill="#ffdbd0" />
      <circle cx="180" cy="5" r="4" fill="#8a4b36" />
      <circle cx="225" cy="11" r="5" fill="#e7bea7" />
      <circle cx="270" cy="14" r="6" fill="#ffdbd0" />
      <circle cx="270" cy="14" r="4" fill="#8a4b36" />
      <circle cx="315" cy="11" r="5" fill="#e7bea7" />
      <path
        d="M90 20 L90 27 M180 12 L180 20 M270 20 L270 27"
        stroke="#8a4b36"
        strokeWidth="1"
      />
      <circle cx="90" cy="28" r="2.5" fill="#8a4b36" />
      <circle cx="180" cy="21" r="2.5" fill="#8a4b36" />
      <circle cx="270" cy="28" r="2.5" fill="#8a4b36" />
    </svg>
  );
}

/** Decorative terracotta-toned map illustration for odd event cards */
function MapIllustrationTerracotta() {
  return (
    <svg
      className="w-full h-28 rounded-xl"
      viewBox="0 0 320 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="112" rx="12" fill="#faf9f7" />
      {/* Roads */}
      <path d="M0 56 H320" stroke="#e7bea7" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M160 0 V112" stroke="#e7bea7" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M40 20 Q160 90 280 30" stroke="#ffdbd0" strokeWidth="1.5" fill="none" />
      {/* Buildings */}
      <rect x="60" y="36" width="24" height="18" rx="3" fill="#ffdbd0" />
      <rect x="100" y="62" width="20" height="14" rx="2" fill="#e7bea7" />
      <rect x="200" y="30" width="28" height="20" rx="3" fill="#ffdbd0" />
      <rect x="250" y="65" width="22" height="16" rx="2" fill="#e7bea7" />
      {/* Trees */}
      <circle cx="140" cy="38" r="6" fill="#d4e4ce" />
      <circle cx="180" cy="78" r="5" fill="#d4e4ce" />
      <circle cx="230" cy="42" r="4" fill="#d4e4ce" />
      {/* Map pin */}
      <g className="animate-bounce" style={{ transformOrigin: "160px 50px" }}>
        <path
          d="M160 50 C160 42 152 36 152 28 A8 8 0 1 1 168 28 C168 36 160 42 160 50Z"
          fill="#8a4b36"
        />
        <circle cx="160" cy="28" r="3.5" fill="#ffdbd0" />
      </g>
      {/* Shadow under pin */}
      <ellipse cx="160" cy="52" rx="6" ry="2" fill="#8a4b36" opacity="0.2" />
    </svg>
  );
}

/** Decorative sage-toned map illustration for even event cards */
function MapIllustrationSage() {
  return (
    <svg
      className="w-full h-28 rounded-xl"
      viewBox="0 0 320 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="112" rx="12" fill="#f5f8f5" />
      {/* Roads */}
      <path d="M0 60 H320" stroke="#d4e4ce" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M100 0 V112" stroke="#d4e4ce" strokeWidth="1.5" strokeDasharray="4 6" />
      <path d="M50 80 Q160 20 300 70" stroke="#d4e4ce" strokeWidth="1.5" fill="none" />
      {/* Buildings */}
      <rect x="50" y="32" width="22" height="16" rx="3" fill="#d4e4ce" />
      <rect x="130" y="68" width="26" height="18" rx="3" fill="#d4e4ce" />
      <rect x="220" y="36" width="20" height="14" rx="2" fill="#d4e4ce" />
      <rect x="270" y="60" width="24" height="16" rx="3" fill="#d4e4ce" />
      {/* Trees */}
      <circle cx="80" cy="70" r="5" fill="#b8d4b0" />
      <circle cx="180" cy="40" r="6" fill="#b8d4b0" />
      <circle cx="250" cy="80" r="4" fill="#b8d4b0" />
      {/* Map pin */}
      <g className="animate-bounce" style={{ transformOrigin: "160px 46px" }}>
        <path
          d="M160 46 C160 38 152 32 152 24 A8 8 0 1 1 168 24 C168 32 160 38 160 46Z"
          fill="#536251"
        />
        <circle cx="160" cy="24" r="3.5" fill="#d4e4ce" />
      </g>
      <ellipse cx="160" cy="48" rx="6" ry="2" fill="#536251" opacity="0.2" />
    </svg>
  );
}

/* ───────────────────────── inline SVG icons ───────────────────────── */

function MusicOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function MusicOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BentoClay – Bento-style Mobile-first Islamic Wedding Template
   ═══════════════════════════════════════════════════════════════ */

export default function BentoClay({ data, weddingId, isPreview }: TemplateProps) {
  const { couple, story, events, gallery, rsvpConfig, theme } = data;

  /* ── state ── */
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [blessingCount, setBlessingCount] = useState(0);
  const [activeNav, setActiveNav] = useState<"schedule" | "directions" | "share">("schedule");
  const heartContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── countdown timer ── */
  const [timeLeft, setTimeLeft] = useState({
    days: "0",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const countdownTarget = useMemo(() => {
    const firstEvent = events?.[0];
    if (firstEvent?.date) {
      const time = firstEvent.startTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(firstEvent.startTime)
        ? `${firstEvent.startTime}:00`
        : "09:00:00";
      const parsed = Date.parse(`${firstEvent.date}T${time}+05:30`);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (couple.weddingDate) {
      const parsed = Date.parse(`${couple.weddingDate}T09:00:00+05:30`);
      if (Number.isFinite(parsed)) return parsed;
    }
    return Date.now() + 30 * 24 * 60 * 60 * 1000;
  }, [events, couple.weddingDate]);

  useEffect(() => {
    const tick = () => {
      const diff = countdownTarget - Date.now();
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
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdownTarget]);

  /* ── music toggle ── */
  const toggleMusic = useCallback(() => {
    if (!theme?.backgroundMusicUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(theme.backgroundMusicUrl);
      audioRef.current.loop = true;
    }

    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setMusicPlaying((p) => !p);
  }, [musicPlaying, theme?.backgroundMusicUrl]);

  /* ── floating hearts animation ── */
  const handleBlessingClick = useCallback(() => {
    setBlessingCount((prev) => prev + 1);

    if (!heartContainerRef.current) return;
    const container = heartContainerRef.current;

    for (let i = 0; i < 6; i++) {
      const heart = document.createElement("span");
      heart.innerText = ["❤", "💛", "🧡", "💖", "🤍"][Math.floor(Math.random() * 5)];
      heart.className =
        "absolute text-lg select-none pointer-events-none transition-all duration-[1200ms] ease-out";
      const randomX = Math.random() * 70 + 15;
      heart.style.left = `${randomX}%`;
      heart.style.bottom = "20%";
      heart.style.opacity = "1";
      heart.style.transform = `translateY(0) scale(${Math.random() * 0.5 + 0.8})`;

      container.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.transform = `translateY(-160px) scale(1.5) rotate(${Math.random() * 40 - 20}deg)`;
        heart.style.opacity = "0";
      });

      setTimeout(() => {
        heart.remove();
      }, 1200);
    }
  }, []);

  /* ── derived ── */
  const formattedDate = useMemo(() => formatDate(couple.weddingDate), [couple.weddingDate]);
  const groomFirst = couple.groomName?.split(" ")[0] || "Groom";
  const brideFirst = couple.brideName?.split(" ")[0] || "Bride";
  const defaultHashtag = `#${groomFirst}Weds${brideFirst}`;
  const hashtag = couple.hashtag || defaultHashtag;

  const whatsappShareUrl = useMemo(() => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://everafter.app";
    const invitationPath = isPreview ? "/studio/preview" : `/${couple.hashtag?.replace(/^#/, "") || "our-wedding"}`;
    const shareUrl = `${siteOrigin}${invitationPath}`;
    const text = encodeURIComponent(
      `💌 You're invited to the wedding of ${couple.groomName || "the Groom"} & ${couple.brideName || "the Bride"} on ${formattedDate || "our wedding day"}!

${hashtag}

View our wedding invitation: ${shareUrl}`
    );
    // General share: no preselected recipient phone so guests can share with their contacts
    return `https://api.whatsapp.com/send?text=${text}`;
  }, [couple.groomName, couple.brideName, formattedDate, hashtag, isPreview]);

  const firstEventMapUrl = (events?.[0] ? getDirectionsUrl(events[0]) : null) || "#directions";

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1c1b] antialiased selection:bg-[#8a4b36]/20 selection:text-[#8a4b36] relative overflow-x-hidden"
      style={{ fontFamily: theme?.fontFamily === 'serif' ? 'Georgia, serif' : theme?.fontFamily === 'playfair' ? "'Playfair Display', Georgia, serif" : 'system-ui, -apple-system, sans-serif' }}>
      {/* ╔══════════════════════════════════════════════════════╗
          ║  1 · FIXED HEADER                                   ║
          ╚══════════════════════════════════════════════════════╝ */}
      <header className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#faf9f7]/80 backdrop-blur-md border-b border-[#86736d]/10">
        <h1 className="text-sm font-serif font-bold tracking-widest text-[#8a4b36] uppercase">
          Invitation
        </h1>
        <div className="flex items-center gap-3">
          {theme?.backgroundMusicUrl && (
            <button
              type="button"
              onClick={toggleMusic}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ffdbd0]/60 text-[#8a4b36] hover:bg-[#ffdbd0] transition-colors"
              aria-label={musicPlaying ? "Pause music" : "Play music"}
            >
              {musicPlaying ? <MusicOnIcon /> : <MusicOffIcon />}
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-[#a8624c] flex items-center justify-center text-white text-xs font-bold uppercase">
            {groomFirst[0]}{brideFirst[0]}
          </div>
        </div>
      </header>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  2 · STORY-STYLE HERO CARD                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="px-3 pt-2 animate-fade-in-up">
        <div className="relative w-full max-w-lg mx-auto aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(138,75,54,0.18)] hover-lift transition-all duration-700">
          {/* Cover photo */}
          {couple.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={couple.coverPhotoUrl}
              alt={`${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#e7bea7] via-[#ffdbd0] to-[#d4e4ce] flex items-center justify-center">
              <span className="text-6xl opacity-40 animate-pulse-glow">💍</span>
            </div>
          )}

          {/* Top gradient scrim */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
          {/* Bottom gradient scrim */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Toran SVG at top */}
          <div className="absolute top-0 inset-x-0 z-10 animate-fade-in-down">
            <ToranSVG />
          </div>

          {/* Bismillah pill at top */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 animate-float-gentle">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-white/60">
              <span className="text-[#8a4b36] text-xs font-serif tracking-wide">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            </div>
          </div>

          {/* Couple names overlay at bottom */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-6 flex flex-col items-center text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/80 font-sans font-medium mb-2">
              The Wedding Of
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight drop-shadow-lg">
              {couple.groomName || "Groom Name"}
            </h2>
            <span className="text-lg font-serif italic text-[#ffdbd0] my-0.5">&amp;</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight drop-shadow-lg">
              {couple.brideName || "Bride Name"}
            </h2>
            <p className="text-[11px] text-white/80 mt-2 font-sans tracking-wide">
              {formattedDate || "Date to be announced"}
            </p>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  3 · BENTO GRID ROW – Countdown + Tap-to-Bless      ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="px-3 mt-4 max-w-lg mx-auto">
        <RevealOnScroll direction="up" className="grid grid-cols-5 gap-3">
          {/* Countdown card – 3/5 width */}
          <div className="col-span-3 bg-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(138,75,54,0.08)] border border-[#e7bea7]/40 flex flex-col justify-between hover-lift transition-all">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-xs">⏳</span>
              <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] font-bold font-sans">
                Counting Down
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { val: timeLeft.days, label: "Days" },
                { val: timeLeft.hours, label: "Hrs" },
                { val: timeLeft.minutes, label: "Min" },
                { val: timeLeft.seconds, label: "Sec" },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <span className="text-2xl font-serif font-bold text-[#8a4b36]">
                    {unit.val}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-[#86736d] font-semibold font-sans mt-0.5">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1 rounded-full bg-[#ffdbd0]/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8a4b36] to-[#a8624c] transition-all duration-1000"
                style={{ width: `${Math.max(5, 100 - Number(timeLeft.days))}%` }}
              />
            </div>
          </div>

          {/* Tap-to-Bless "Send Dua" widget – 2/5 width */}
          <div className="col-span-2 relative bg-gradient-to-br from-[#536251] to-[#3e5240] rounded-2xl p-4 shadow-[0_8px_24px_rgba(83,98,81,0.15)] flex flex-col items-center justify-center text-center overflow-hidden hover-lift transition-all">
            <div ref={heartContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
            <span className="text-2xl mb-1">🤲</span>
            <span className="text-[9px] uppercase tracking-widest text-[#d4e4ce] font-bold font-sans mb-2">
              Send Dua
            </span>
            <button
              type="button"
              onClick={handleBlessingClick}
              className="group active:scale-90 transition-transform w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg hover:bg-white/30 cursor-pointer tap-bounce"
              aria-label="Send blessings"
            >
              <span className="text-xl group-active:scale-125 transition-transform">❤</span>
            </button>
            <span className="text-[10px] text-[#d4e4ce] mt-2 font-sans font-medium">
              {blessingCount > 0 ? (
                <><span className="font-bold text-white">{blessingCount}</span> {blessingCount === 1 ? "dua sent" : "duas sent"}</>
              ) : (
                <span className="font-medium text-white/90">Send Dua</span>
              )}
            </span>
          </div>
        </RevealOnScroll>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  4 · QURANIC VERSE CARD                             ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="px-3 mt-4 max-w-lg mx-auto">
        <RevealOnScroll direction="up" className="relative w-full rounded-2xl bg-white border border-[#e7bea7]/40 p-6 shadow-[0_8px_24px_rgba(138,75,54,0.06)] overflow-hidden text-center flex flex-col items-center hover-lift transition-all duration-300">
          {/* Decorative blurs */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#ffdbd0]/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#d4e4ce]/40 rounded-full blur-2xl" />

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#8a4b36]/40" />
            <span className="text-[#8a4b36] text-xs">✦</span>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#8a4b36]/40" />
          </div>

          <p className="text-[#1a1c1b] text-lg md:text-xl font-serif leading-loose mb-3 tracking-wide px-2 select-none font-medium" dir="rtl">
            وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
          </p>

          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#8a4b36] to-transparent my-2" />

          <p className="text-xs text-[#1a1c1b]/70 italic font-normal max-w-sm mt-1 leading-relaxed font-sans">
            &ldquo;And among His signs is that He created for you mates from among yourselves, that you may dwell in peace with them, and He put between you love and mercy.&rdquo;
          </p>
          <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] mt-2 font-semibold font-sans">
            Surah Ar-Rum · 30:21
          </span>
        </RevealOnScroll>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  5 · SACRED CEREMONIES / EVENT CARDS                 ║
          ╚══════════════════════════════════════════════════════╝ */}
      {events && events.length > 0 && (
        <section id="schedule" className="px-3 mt-8 max-w-lg mx-auto">
          <RevealOnScroll direction="up" className="flex flex-col items-center mb-6 text-center">
            <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] font-semibold font-sans">
              InshaAllah
            </span>
            <h2 className="text-2xl text-[#1a1c1b] font-serif mt-1 font-bold">
              Sacred Ceremonies
            </h2>
            <div className="flex items-center gap-2 mt-2 text-[#8a4b36]">
              <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#8a4b36]" />
              <span className="text-xs">❀ ✦ ❀</span>
              <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#8a4b36]" />
            </div>
          </RevealOnScroll>

          <div className="flex flex-col w-full gap-5">
            {events.map((evt: VenueEvent, idx: number) => {
              const isEven = idx % 2 === 0;
              return (
                <RevealOnScroll
                  key={evt.id}
                  direction="up"
                  delay={idx * 100}
                  className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(138,75,54,0.08)] border border-[#e7bea7]/40 flex flex-col relative hover-lift transition-all duration-300"
                >
                  {/* Date/time badge */}
                  <div className={`flex items-center justify-between px-5 pt-5 pb-2`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold font-sans ${isEven ? "bg-[#8a4b36]" : "bg-[#536251]"}`}>
                        <span className="text-[10px] leading-none">
                          {evt.date ? new Date(evt.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short" }).toUpperCase() : "TBD"}
                        </span>
                        <span className="text-sm leading-none font-serif">
                          {evt.date ? new Date(evt.date).getUTCDate() : "—"}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] uppercase tracking-widest font-bold font-sans ${isEven ? "text-[#8a4b36]" : "text-[#536251]"}`}>
                          {idx === 0 ? "Sacred Ceremony" : `Celebration ${idx + 1}`}
                        </span>
                        <p className="text-[10px] text-[#86736d] font-sans">
                          {formatDate(evt.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-sans font-semibold ${isEven ? "bg-[#ffdbd0]/60 text-[#8a4b36]" : "bg-[#d4e4ce]/60 text-[#536251]"}`}>
                      {formatTime12(evt.startTime)}
                      {evt.endTime ? ` – ${formatTime12(evt.endTime)}` : ""}
                    </span>
                  </div>

                  {/* Event name & description */}
                  <div className="px-5 pb-3">
                    <h3 className="text-xl text-[#1a1c1b] font-serif font-bold mt-1">
                      {evt.eventName}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-[#86736d] font-sans">
                      <span className="text-sm mt-0.5">📍</span>
                      <span>{evt.venueName}{evt.venueAddress ? `, ${evt.venueAddress}` : ""}</span>
                    </div>
                    {evt.dressCode && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#86736d] font-sans">
                        <span className="text-sm">👔</span>
                        <span>Dress code: <span className="font-medium text-[#1a1c1b]">{evt.dressCode}</span></span>
                      </div>
                    )}
                  </div>

                  {/* Stylized map illustration */}
                  <div className="px-5 pb-3">
                    {isEven ? <MapIllustrationTerracotta /> : <MapIllustrationSage />}
                  </div>

                  {/* Google Map Card + Add to Calendar */}
                  <div className="px-5 pb-5 flex flex-col gap-2 border-t border-[#faf9f7] pt-3">
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
              );
            })}
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════════════════════╗
          ║  6 · FAMILIES & LINEAGE                             ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="px-3 mt-8 max-w-lg mx-auto">
        <RevealOnScroll direction="up" className="flex flex-col items-center mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] font-semibold font-sans">
            Alhamdulillah
          </span>
          <h2 className="text-2xl text-[#1a1c1b] font-serif mt-1 font-bold">
            Families &amp; Lineage
          </h2>
          <div className="flex items-center gap-2 mt-2 text-[#8a4b36]">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#8a4b36]" />
            <span className="text-xs">❀ ✦ ❀</span>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#8a4b36]" />
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-2 gap-3">
          {/* Groom card */}
          <RevealOnScroll direction="up" delay={50} className="bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(138,75,54,0.06)] border border-[#e7bea7]/30 flex flex-col items-center text-center hover-lift transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#ffdbd0]/50 text-[#8a4b36] flex items-center justify-center mb-2 text-2xl">
              🤵
            </div>
            <span className="text-[9px] uppercase tracking-widest text-[#8a4b36] font-bold font-sans">
              Groom
            </span>
            <h3 className="text-base text-[#1a1c1b] mt-1 font-serif font-semibold leading-tight">
              {couple.groomName || "Groom Name"}
            </h3>
            {couple.groomBio && (
              <>
                <div className="w-10 h-[1px] bg-[#e7bea7]/60 my-3" />
                <p className="text-[11px] text-[#86736d] leading-relaxed font-sans">
                  {couple.groomBio}
                </p>
              </>
            )}
          </RevealOnScroll>

          {/* Bride card */}
          <RevealOnScroll direction="up" delay={150} className="bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(83,98,81,0.06)] border border-[#d4e4ce]/40 flex flex-col items-center text-center hover-lift transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#d4e4ce]/50 text-[#536251] flex items-center justify-center mb-2 text-2xl">
              👰
            </div>
            <span className="text-[9px] uppercase tracking-widest text-[#536251] font-bold font-sans">
              Bride
            </span>
            <h3 className="text-base text-[#1a1c1b] mt-1 font-serif font-semibold leading-tight">
              {couple.brideName || "Bride Name"}
            </h3>
            {couple.brideBio && (
              <>
                <div className="w-10 h-[1px] bg-[#d4e4ce]/60 my-3" />
                <p className="text-[11px] text-[#86736d] leading-relaxed font-sans">
                  {couple.brideBio}
                </p>
              </>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  7 · SUNNAH DUA & SHARE CARD                        ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="px-3 mt-8 mb-8 max-w-lg mx-auto">
        <RevealOnScroll direction="up" className="relative w-full rounded-2xl bg-gradient-to-br from-[#8a4b36] to-[#a8624c] p-6 shadow-[0_16px_40px_rgba(138,75,54,0.2)] overflow-hidden text-center flex flex-col items-center text-white hover-lift transition-all duration-300">
          {/* Decorative blurs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#ffdbd0]/20 rounded-full blur-2xl" />

          <span className="text-3xl mb-2">🤲</span>
          <h3 className="text-xl font-serif font-bold mb-2">
            Sunnah Wedding Dua
          </h3>

          <p className="text-white/90 text-base font-serif leading-loose mb-2 select-none" dir="rtl">
            بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
          </p>

          <div className="h-[1px] w-20 bg-white/30 my-2" />

          <p className="text-[11px] text-white/80 italic font-sans max-w-sm leading-relaxed">
            &ldquo;May Allah bless you, shower His blessings upon you, and unite you both in goodness.&rdquo;
          </p>

          <p className="text-[10px] uppercase tracking-widest text-[#ffdbd0] mt-3 font-semibold font-sans">
            Barakallahu laka wa baraka alayka
          </p>

          {/* Hashtag pill */}
          <div className="mt-5 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
            <span className="text-sm font-serif font-bold text-white">{hashtag}</span>
          </div>

          {/* WhatsApp share CTA */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-white text-[#8a4b36] rounded-full px-6 py-3 font-sans font-bold text-sm shadow-lg hover:shadow-xl transition-shadow active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Share via WhatsApp</span>
          </a>
        </RevealOnScroll>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  8 · GALLERY SECTION (if photos exist)              ║
          ╚══════════════════════════════════════════════════════╝ */}
      {gallery && gallery.length > 0 && (
        <section className="px-3 mt-4 mb-8 max-w-lg mx-auto">
          <RevealOnScroll direction="up" className="flex flex-col items-center mb-4 text-center">
            <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] font-semibold font-sans">
              MashaAllah
            </span>
            <h2 className="text-2xl text-[#1a1c1b] font-serif mt-1 font-bold">
              Gallery
            </h2>
          </RevealOnScroll>
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((url, idx) => (
              <RevealOnScroll
                key={idx}
                direction="scale"
                delay={idx * 60}
                className={`relative rounded-xl overflow-hidden shadow-sm hover-lift transition-all group ${idx === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </RevealOnScroll>
            ))}
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════════════════════╗
          ║  9 · OUR STORY (if story content exists)            ║
          ╚══════════════════════════════════════════════════════╝ */}
      {story && (story.content || (story.milestones && story.milestones.length > 0)) && (
        <section className="px-3 mt-4 mb-8 max-w-lg mx-auto">
          <RevealOnScroll direction="up">
            <div className="flex flex-col items-center mb-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#8a4b36] font-semibold font-sans">
                Our Journey
              </span>
              <h2 className="text-2xl text-[#1a1c1b] font-serif mt-1 font-bold">
                {story.title || "Our Story"}
              </h2>
            </div>

            {story.content && (
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(138,75,54,0.06)] border border-[#e7bea7]/30 mb-4 hover-lift transition-all">
                <p className="text-sm text-[#1a1c1b]/80 leading-relaxed font-sans">
                  {story.content}
                </p>
              </div>
            )}

            {story.milestones && story.milestones.length > 0 && (
              <div className="flex flex-col gap-3">
                {story.milestones.map((ms, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start hover-lift transition-all"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[#ffdbd0] text-[#8a4b36] flex items-center justify-center text-xs font-bold font-serif shrink-0">
                        {ms.year}
                      </div>
                      {idx < story.milestones!.length - 1 && (
                        <div className="w-[1px] h-8 bg-[#e7bea7]/60 mt-1" />
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e7bea7]/20 flex-1">
                      <h4 className="text-sm font-serif font-semibold text-[#1a1c1b]">
                        {ms.title}
                      </h4>
                      <p className="text-xs text-[#86736d] mt-0.5 font-sans leading-relaxed">
                        {ms.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RevealOnScroll>
        </section>
      )}

      {/* 9.5 · RSVP CARD */}
      {rsvpConfig?.enabled && (
        <section className="px-3 mt-6 max-w-lg mx-auto">
          <RevealOnScroll direction="up" className="bg-white rounded-3xl p-6 shadow-[0_12px_32px_rgba(138,75,54,0.08)] border border-[#e7bea7]/40 text-center">
            <span className="text-2xl">💌</span>
            <h2 className="text-xl font-serif font-bold text-[#8a4b36] mt-2">Will You Join Us?</h2>
            {rsvpConfig.deadline && (
              <p className="text-xs uppercase tracking-wider text-[#86736d] mt-1 font-sans">
                Kindly respond by {formatDate(rsvpConfig.deadline)}
              </p>
            )}
            <div className="mt-4 flex flex-col items-center gap-2">
              {rsvpConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! I would love to RSVP for ${couple.brideName} & ${couple.groomName}'s wedding!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full text-white text-xs font-sans font-semibold tracking-wide bg-[#8a4b36] hover:bg-[#723c2a] shadow-md transition-all duration-300"
                >
                  RSVP via WhatsApp
                </a>
              ) : isPreview ? (
                <p className="text-xs text-[#86736d] font-sans">
                  Add your WhatsApp number in the <strong>RSVP &amp; URL</strong> tab to enable guest responses.
                </p>
              ) : null}
            </div>
          </RevealOnScroll>
        </section>
      )}

      {/* ╔══════════════════════════════════════════════════════╗
          ║  10 · FIXED BOTTOM NAV BAR                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <nav id="directions" className="sticky bottom-4 mx-auto w-fit flex items-center gap-1 bg-[#1a1c1b]/90 backdrop-blur-md rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 z-50">
        {/* Schedule tab */}
        <a
          href="#schedule"
          onClick={() => setActiveNav("schedule")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-sans font-medium whitespace-nowrap transition-colors ${
            activeNav === "schedule"
              ? "bg-[#8a4b36] text-white"
              : "text-white/60 hover:text-white/90"
          }`}
        >
          <ScheduleIcon />
          <span>Schedule</span>
        </a>

        {/* Directions tab */}
        <a
          href={firstEventMapUrl}
          target={firstEventMapUrl.startsWith("http") ? "_blank" : undefined}
          rel={firstEventMapUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={() => setActiveNav("directions")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-sans font-medium whitespace-nowrap transition-colors ${
            activeNav === "directions"
              ? "bg-[#536251] text-white"
              : "text-white/60 hover:text-white/90"
          }`}
        >
          <DirectionsIcon />
          <span>Directions</span>
        </a>

        {/* Share tab */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setActiveNav("share")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-sans font-medium whitespace-nowrap transition-colors ${
            activeNav === "share"
              ? "bg-[#a8624c] text-white"
              : "text-white/60 hover:text-white/90"
          }`}
        >
          <ShareIcon />
          <span>Share</span>
        </a>
      </nav>
    </div>
  );
}
