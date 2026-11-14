"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Copy,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import type { WeddingTemplateProps, VenueEvent } from "@/types/wedding";
import { getGoogleCalendarUrl } from "@/components/shared/WeddingActionHelpers";

export interface OnChairProps extends WeddingTemplateProps {
  activeScreen?: number;
}

export default function OnChair({
  data,
  isPreview = false,
  activeScreen,
}: OnChairProps) {
  const rawData = data;

  // Normalized couple data
  const couple = {
    brideName: rawData.couple?.brideName || "Nusrath",
    groomName: rawData.couple?.groomName || "Rabiyath",
    weddingDate: rawData.couple?.weddingDate || "2027-01-24",
    coverPhotoUrl: rawData.couple?.coverPhotoUrl || "/templates/on-chair/poster.jpg",
  };

  // Groom and Bride specific biographical and family details
  const groomName =
    rawData.groom?.name ||
    (rawData.couple?.groomName === "Nusrath" ? "Rabiyath" : rawData.couple?.groomName || "Rabiyath");
  const brideName =
    rawData.bride?.name ||
    (rawData.couple?.brideName === "Rabiyath" ? "Nusrath" : rawData.couple?.brideName || "Nusrath");

  const groomData = {
    name: groomName,
    fatherName: rawData.groom?.fatherName ?? "Koolakkattil Moosa",
    motherName: rawData.groom?.motherName ?? "Zainaba (Late Chennangadan)",
  };

  const brideData = {
    name: brideName,
    fatherName: rawData.bride?.fatherName ?? "Koolakkattil Moosa",
    motherName: rawData.bride?.motherName ?? "Zainaba (Late Chennangadan)",
  };

  const formatCeremonyTitle = (title: string) => title.replace(/^the\s+/i, "");

  // Detailed ceremony card details for Screen 4
  const ceremonyDetails1 = {
    title: formatCeremonyTitle(rawData.ceremonies?.[0]?.title ?? "Nikah Ceremony"),
    subtitle: rawData.ceremonies?.[0]?.subtitle ?? "Nikah & Lunch Reception",
    dateText: rawData.ceremonies?.[0]?.dateText ?? "22nd October 2026 • Thursday",
    hijriDate: rawData.ceremonies?.[0]?.hijriDate ?? "[10 Rabi'ul Akhir 1448]",
    timeText: rawData.ceremonies?.[0]?.timeText ?? "9:30 AM IST",
    venueName: rawData.ceremonies?.[0]?.venueName ?? "Salavath Juma Masjid",
    venueAddress: rawData.ceremonies?.[0]?.venueAddress ?? "Kizhakkumpadam Mahallu, Mongam, Malappuram",
  };

  const ceremonyDetails2 = {
    title: formatCeremonyTitle(rawData.ceremonies?.[1]?.title ?? "Nikah Ceremony"),
    subtitle: rawData.ceremonies?.[1]?.subtitle ?? "Nikah & Lunch Reception",
    dateText: rawData.ceremonies?.[1]?.dateText ?? "22nd October 2026 • Thursday",
    hijriDate: rawData.ceremonies?.[1]?.hijriDate ?? "[10 Rabi'ul Akhir 1448]",
    timeText: rawData.ceremonies?.[1]?.timeText ?? "9:30 AM IST",
    venueName: rawData.ceremonies?.[1]?.venueName ?? "Salavath Juma Masjid",
    venueAddress: rawData.ceremonies?.[1]?.venueAddress ?? "Kizhakkumpadam Mahallu, Mongam, Malappuram",
  };

  const blessingDetails = {
    message: rawData.blessing?.message ?? `${groomData.name} and ${brideData.name} embark on a sacred journey of love, faith, and lifelong companionship, trusting in the will of Allah. May Allah bless their union with barakah, mawaddah, and rahmah.`,
    verse: rawData.blessing?.verse ?? "And He has put love and mercy between your hearts.",
    verseReference: rawData.blessing?.verseReference ?? "Surah Ar-Rum [30:21]",
    arabicDua: rawData.blessing?.arabicDua ?? "بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    closingMessage: rawData.blessing?.closingMessage ?? "May Allah bless you and shower His blessings upon you and unite you in love and goodness.",
  };

  // Video background sources
  const videoSrc = rawData.hero?.videoUrl || "/templates/on-chair/background.mp4";
  const posterSrc = rawData.hero?.posterUrl || "/templates/on-chair/poster.jpg";

  // Events normalized
  const events: VenueEvent[] = useMemo(() => {
    if (Array.isArray(rawData.events) && rawData.events.length > 0) {
      return rawData.events;
    }
    return [
      {
        id: "nikah-ceremony",
        eventName: "Nikah Ceremony",
        date: "2026-10-22",
        startTime: "9:30 AM",
        endTime: "13:00",
        venueName: "CK Convention Center Chavakkad",
        venueAddress: "CK Convention Center, Bypass Road, Chavakkad, Thrissur, Kerala",
        googleMapsUrl: "https://maps.google.com/?q=CK+Convention+Center+Chavakkad",
      },
      {
        id: "wedding-ceremony",
        eventName: "Wedding Ceremony",
        date: "2026-10-22",
        startTime: "9:30 AM",
        endTime: "15:00",
        venueName: "CK Convention Center Chavakkad",
        venueAddress: "CK Convention Center, Bypass Road, Chavakkad, Thrissur, Kerala",
        googleMapsUrl: "https://maps.google.com/?q=CK+Convention+Center+Chavakkad",
      },
    ];
  }, [rawData.events]);

  const event1 = events[0] || {
    id: "nikah-ceremony",
    eventName: "Nikah Ceremony",
    date: "2026-10-22",
    startTime: "9:30 AM",
    venueName: "CK Convention Center Chavakkad",
    venueAddress: "CK Convention Center, Bypass Road, Chavakkad, Thrissur, Kerala",
    googleMapsUrl: "https://maps.google.com/?q=CK+Convention+Center+Chavakkad",
  };
  const event2 = events[1] || event1;

  // Helper for ceremony cards
  const formatCard = (event?: VenueEvent, defaultName = "CEREMONY") => {
    const dateStr = event?.date || "2026-10-22";
    let dayNum = "22";
    let monthYear = "October 2026";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
      if (!isNaN(d.getTime())) {
        dayNum = d.getUTCDate().toString();
        monthYear = d.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
      }
    } catch {}

    return {
      dayNum,
      monthYear,
      time: event?.startTime || "9:30 AM",
      venue: event?.venueName || "CK Convention Center Chavakkad",
      name: event?.eventName || defaultName,
    };
  };

  const card1 = formatCard(event1, "NIKAH CEREMONY");
  const card2 = formatCard(event2, "WEDDING CEREMONY");

  // Format date helper for the hero capsule badge
  const heroDateObj = useMemo(() => {
    try {
      const d = new Date(
        couple.weddingDate.includes("T") ? couple.weddingDate : `${couple.weddingDate}T00:00:00Z`
      );
      if (isNaN(d.getTime())) {
        return { dayNum: "24", monthStr: "Jan", yearStr: "2027", weekday: "Sunday" };
      }
      const rawWeekday = d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long" });
      const capitalizedWeekday = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
      return {
        dayNum: d.getUTCDate().toString(),
        monthStr: d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short" }),
        yearStr: d.getUTCFullYear().toString(),
        weekday: capitalizedWeekday,
      };
    } catch {
      return { dayNum: "24", monthStr: "Jan", yearStr: "2027", weekday: "Sunday" };
    }
  }, [couple.weddingDate]);

  // Format venue label across two lines when it is the CK Convention Center.
  const venueLines = useMemo(() => {
    const venue = event1.venueName || "CK Convention Center";
    let clean = venue.trim();
    if (clean.startsWith("@")) clean = clean.substring(1).trim();

    if (/ck\s*convention/i.test(clean)) {
      return {
        line1: "CK Convention",
        line2: "Center",
      };
    }

    const words = clean.split(/\s+/);
    if (words.length <= 1) {
      return { line1: `@${words[0]}`, line2: "" };
    }
    const mid = Math.ceil(words.length / 2);
    return {
      line1: `@${words.slice(0, mid).join(" ")}`,
      line2: words.slice(mid).join(" "),
    };
  }, [event1.venueName]);

  const heroTimeLabel = event1.startTime || "16:30";

  // Days remaining calculation for Big Countdown in Screen 2
  const daysRemaining = useMemo(() => {
    if (rawData.hero?.daysToGo) return String(rawData.hero.daysToGo);
    if (rawData.countdown?.daysRemaining) return String(rawData.countdown.daysRemaining);
    try {
      const target = new Date(
        couple.weddingDate.includes("T") ? couple.weddingDate : `${couple.weddingDate}T00:00:00Z`
      ).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) return "07";
      const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return d < 10 ? `0${d}` : `${d}`;
    } catch {
      return "07";
    }
  }, [rawData.hero?.daysToGo, rawData.countdown?.daysRemaining, couple.weddingDate]);

  // Video & Audio state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [blessingCount, setBlessingCount] = useState(0);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteLinkCopyError, setInviteLinkCopyError] = useState(false);

  // Synchronize activeScreen if provided externally
  useEffect(() => {
    if (activeScreen !== undefined && scrollContainerRef.current) {
      const height = scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTo({
        top: activeScreen * height,
        behavior: "smooth",
      });
    }
  }, [activeScreen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Scroll smoothly to next section
  const scrollToNext = () => {
    if (!scrollContainerRef.current) return;
    const height = scrollContainerRef.current.clientHeight;
    scrollContainerRef.current.scrollBy({ top: height, behavior: "smooth" });
  };

  // Copy address to clipboard
  const handleCopyAddress = () => {
    const address = event1.venueAddress || "CK Convention Center, Chavakkad, Thrissur, Kerala";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(() => {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      }).catch(() => {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      });
    } else {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const inviteUrl = new URL(window.location.href);
      inviteUrl.hash = "";
      await navigator.clipboard.writeText(inviteUrl.toString());
      setInviteLinkCopied(true);
      setInviteLinkCopyError(false);
    } catch {
      setInviteLinkCopied(false);
      setInviteLinkCopyError(true);
    }
  };

  const handleShareOnWhatsApp = () => {
    const inviteUrl = new URL(window.location.href);
    inviteUrl.hash = "";
    const message = `Join us to celebrate ${groomData.name} and ${brideData.name}! ${inviteUrl.toString()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Calendar URLs
  const googleCalUrl = useMemo(
    () => getGoogleCalendarUrl(event1, couple),
    [couple, event1]
  );

  const googleMapsUrl = event1.googleMapsUrl || "https://maps.google.com/?q=CK+Convention+Center+Chavakkad";
  const appleMapsUrl = `http://maps.apple.com/?q=${encodeURIComponent(event1.venueName || "CK Convention Center Chavakkad")}`;

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#061512] text-white select-none ${
        isPreview ? "h-full" : "h-[100dvh]"
      }`}
    >
      {/* ── GOOGLE FONTS INJECTION ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@600;700;800&family=Dancing+Script:wght@500;600;700&family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Prata&family=Sacramento&display=swap');

            .on-chair-names {
              font-family: 'Playfair Display', Georgia, serif;
              color: #d2f328;
              text-shadow: 0 0 22px rgba(210, 243, 40, 0.42), 0 2px 8px rgba(0, 0, 0, 0.9);
            }
            .on-chair-script {
              font-family: 'Sacramento', 'Great Vibes', cursive;
            }
            .on-chair-capsule-script {
              font-family: 'Great Vibes', cursive;
            }
            .on-chair-days-script {
              font-family: 'Alex Brush', 'Dancing Script', cursive;
            }
            .on-chair-arabic {
              font-family: 'Amiri', serif;
            }
            .on-chair-glass {
              background: rgba(14, 44, 36, 0.65);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              border: 1.5px solid rgba(255, 255, 255, 0.28);
              box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            }
            .on-chair-card-glass {
              background: rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              border: 1px solid rgba(255, 255, 255, 0.18);
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
            }
            .wedding-glass-card {
              background: rgba(18, 54, 48, 0.45);
              backdrop-filter: blur(12px) saturate(140%);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(180, 220, 200, 0.25);
              box-shadow: rgba(255, 255, 255, 0.18) 0px 1px 1px 0px inset, rgba(0, 0, 0, 0.3) 0px 8px 32px 0px;
            }
            .glass-panel {
              background: linear-gradient(135deg, rgba(22, 58, 54, 0.75) 0%, rgba(13, 40, 37, 0.7) 100%);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              border: 1px solid rgba(255, 255, 255, 0.16);
              box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
            }
            .lime-accent {
              color: #ccff00;
            }
            .bg-lime-accent {
              background-color: #ccff00;
            }
          `,
        }}
      />

      {/* ── FIXED CONTINUOUS BACKGROUND VIDEO (Stays fixed & loops across both scrolls) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover object-center pointer-events-none"
        />
        {/* Subtle contrast gradient scrims */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55 pointer-events-none" />
      </div>

      {/* ── FLOATING AUDIO & VIDEO CONTROLS ── */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/90 hover:text-white hover:bg-black/75 transition-all shadow-md active:scale-95"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/70" /> : <Volume2 className="w-3.5 h-3.5 text-[#d2f328]" />}
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/90 hover:text-white hover:bg-black/75 transition-all shadow-md active:scale-95"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#d2f328]" />}
        </button>
      </div>

      {/* ── SCROLLABLE PAGES CONTAINER ── */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* ─────────────────────────────────────────────────────────────
            SCREEN 1: HERO SECTION
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-hero"
          className="relative w-full h-full min-h-full snap-start snap-always shrink-0 flex flex-col justify-between items-center text-center px-4 pt-4 sm:pt-6 pb-2"
        >
          {/* Crescent Moon Overlay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/on-chair/crescent-moon.png"
            alt="Crescent Moon"
            className="absolute top-4 sm:top-5 right-[16%] sm:right-[18%] w-5 h-4 sm:w-6 sm:h-5 object-contain pointer-events-none z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          />

          {/* Upper Content Area */}
          <div className="relative z-10 w-full max-w-[420px] translate-y-[20px] flex flex-col items-center text-center px-2">
            {/* Bismillah */}
            <div className="flex justify-center items-center">
              <p
                dir="rtl"
                className="on-chair-arabic text-[12px] sm:text-[13.5px] leading-tight text-white font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>

            {/* Invitation Tagline (Guaranteed 2 clean lines) */}
            <div className="font-sans text-[8.5px] sm:text-[9.5px] text-white/90 leading-[1.35] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1.5 flex flex-col items-center text-center">
              <span className="whitespace-nowrap">
                We cordially invite You to honor us with Your presence
              </span>
              <span className="whitespace-nowrap mt-0.5">
                at the blessed occasion of our wedding
              </span>
            </div>

            {/* Couple Names */}
            <div className="flex translate-y-[10px] flex-col items-center justify-center mt-3 sm:mt-4">
              <h1 className="on-chair-names text-[44px] sm:text-[52px] font-bold tracking-tight leading-[0.88]">
                {groomData.name}
              </h1>

              <div className="-my-1.5 sm:-my-2 z-20">
                <span className="on-chair-script relative top-[5px] text-[36px] sm:text-[42px] text-white font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-none inline-block">
                  weds
                </span>
              </div>

              <h1 className="on-chair-names relative -top-[10px] text-[44px] sm:text-[52px] font-bold tracking-tight leading-[0.88]">
                {brideData.name}
              </h1>
            </div>

            {/* Frosted Glass Nikah Capsule Badge */}
            <div className="on-chair-glass rounded-[15px] px-3.5 py-1.5 sm:py-2 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.55)] w-[190px] mx-auto mt-[30px]">
              <div className="text-center mb-0.5">
                <span className="on-chair-capsule-script text-[15px] sm:text-[16px] text-white font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] leading-none inline-block">
                  Nikah
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 text-left">
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-2.5 w-2.5 text-[#d2f328]" aria-hidden="true" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[#d2f328] text-[13px] sm:text-[14px] font-bold font-sans tracking-tight drop-shadow-sm leading-none">
                      {heroDateObj.dayNum} {heroDateObj.monthStr}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] text-stone-200/90 font-medium font-sans leading-tight mt-0.5 tracking-normal">
                      {heroDateObj.yearStr} {heroDateObj.weekday}
                    </span>
                  </div>
                </div>

                <div className="w-[1px] h-5 sm:h-6 bg-white/20 shrink-0 mx-1.5 self-center" />

                <div className="flex flex-col items-start justify-center min-w-0">
                  <span className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#38bdf8] text-[#0a2540] font-bold text-[7.5px] sm:text-[8px] tracking-wide leading-none shadow-sm">
                    <Clock className="h-2 w-2 shrink-0" aria-hidden="true" />
                    {heroTimeLabel}
                  </span>

                  <div className="flex items-start gap-0.5 text-left mt-0.5 leading-tight">
                    <MapPin className="mt-px h-2.5 w-2.5 shrink-0 text-white/90" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[8.5px] font-sans font-bold text-white tracking-tight whitespace-nowrap">
                        {venueLines.line1}
                      </span>
                      {venueLines.line2 && (
                        <span className="text-[8px] sm:text-[8.5px] font-sans font-bold text-white tracking-tight whitespace-nowrap">
                          {venueLines.line2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower clearance with animated scroll down indicator */}
          <div className="relative z-10 w-full flex flex-col items-center justify-end pb-2 pointer-events-none">
            <button
              type="button"
              onClick={scrollToNext}
              className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer animate-bounce pointer-events-auto p-1.5"
            >
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/80 font-medium drop-shadow-md font-sans">
                Scroll to explore
              </span>
              <ChevronDown className="w-4 h-4 text-[#ccff00]" />
            </button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SCREEN 2: COUNTDOWN & CEREMONIAL DETAILS (NEW SCROLL SECTION)
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-countdown"
          className="relative w-full h-full min-h-full snap-start snap-always shrink-0 flex flex-col justify-between items-center text-center px-4 pt-5 sm:pt-6 pb-2"
        >
          <div className="w-full max-w-[420px] flex flex-col items-center z-10">
            {/* Subtitle Quote */}
            <p className="text-[11px] tracking-wide text-white/90 font-light text-center mb-1 drop-shadow-sm font-sans">
              A life time waits just ahead
            </p>

            {/* Big Countdown Block with Script Overlay */}
            <div className="relative flex flex-col items-center justify-center -my-1 select-none">
              {/* Giant Lime Numbers 07 */}
              <span
                className="text-[84px] sm:text-[92px] font-black leading-none tracking-tighter lime-accent drop-shadow-md"
                style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' }}
              >
                {daysRemaining}
              </span>

              {/* Overlapping Handwriting Script Days to go */}
              <span
                className="on-chair-days-script text-[40px] sm:text-[44px] leading-none text-white -mt-6 sm:-mt-7 tracking-wide font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] select-none z-10"
                style={{ textShadow: "rgba(0, 0, 0, 0.7) 0px 2px 10px, rgba(255, 255, 255, 0.2) 0px 0px 20px" }}
              >
                Days to go
              </span>
            </div>

            {/* Ceremony Details Grid: 2 Frosted Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full mt-[30px] px-2 max-w-[340px]">
              {/* Left Card: Nikah Ceremony */}
              <div className="on-chair-card-glass rounded-2xl py-3 px-2 flex flex-col items-center text-center">
                <h2 className="text-[10px] font-semibold tracking-wider text-white/90 uppercase leading-snug whitespace-nowrap font-sans">
                  NIKAH<br />CEREMONY
                </h2>
                <span
                  className="text-3xl font-extrabold lime-accent my-0.5 leading-none"
                  style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' }}
                >
                  {card1.dayNum}
                </span>
                <div className="text-[10px] sm:text-[10.5px] text-white/95 font-medium leading-relaxed mt-0.5 font-sans">
                  <p>{card1.monthYear}</p>
                  <p className="font-semibold">{card1.time}</p>
                  <p className="text-[9px] text-white/80 mt-0.5 leading-tight font-normal">
                    CK Convention<br />Center Chavakkad
                  </p>
                </div>
              </div>

              {/* Right Card: Wedding Ceremony */}
              <div className="on-chair-card-glass rounded-2xl py-3 px-2 flex flex-col items-center text-center">
                <h2 className="text-[10px] font-semibold tracking-wider text-white/90 uppercase leading-snug whitespace-nowrap font-sans">
                  WEDDING<br />CEREMONY
                </h2>
                <span
                  className="text-3xl font-extrabold lime-accent my-0.5 leading-none"
                  style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' }}
                >
                  {card2.dayNum}
                </span>
                <div className="text-[10px] sm:text-[10.5px] text-white/95 font-medium leading-relaxed mt-0.5 font-sans">
                  <p>{card2.monthYear}</p>
                  <p className="font-semibold">{card2.time}</p>
                  <p className="text-[9px] text-white/80 mt-0.5 leading-tight font-normal">
                    CK Convention<br />Center Chavakkad
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex w-full max-w-[320px] justify-center px-2 mt-3.5">
              <motion.a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ root: scrollContainerRef, once: true, amount: 0.6 }}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[220px] bg-white text-neutral-900 text-center font-bold text-[10.5px] py-2.5 px-3 rounded-full shadow-lg hover:bg-neutral-100 font-sans flex items-center justify-center gap-2"
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Save to Calendar
              </motion.a>
            </div>
          </div>

          {/* Empty bottom space allowing the couple sitting on the bench to be fully visible */}
          <div aria-hidden="true" className="w-full h-1/2 pointer-events-none" />
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SCREEN 3: THE GROOM & THE BRIDE DETAILS (NEW SCROLL SECTION)
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-couple-details"
          className="relative w-full h-full min-h-full snap-start snap-always shrink-0 flex flex-col justify-between items-center text-center px-5 pt-11 pb-2"
        >
          <div className="w-full max-w-[390px] flex flex-col items-center z-10">
            {/* BEGIN: Groom Card */}
            <div className="wedding-glass-card rounded-[24px] px-6 py-4 sm:py-5 text-center w-full mb-3 sm:mb-3.5 shadow-2xl">
              <p
                className="uppercase font-semibold mb-1 tracking-[0.18em] text-[11px] sm:text-[12px] font-sans"
                style={{ color: "rgba(220, 245, 235, 0.85)" }}
              >
                THE GROOM
              </p>
              <h2
                className="font-medium my-0 mb-2 leading-tight"
                style={{
                  color: "#ccff00",
                  fontSize: "36px",
                  letterSpacing: "-0.01em",
                  textShadow: "0 0 16px rgba(200, 255, 0, 0.35)",
                  fontFamily: '"Prata", "Cinzel", "Playfair Display", Georgia, serif',
                }}
              >
                {groomData.name}
              </h2>
              <div
                className="space-y-[2px] leading-relaxed font-sans text-[12px] sm:text-[13px]"
                style={{ color: "rgba(240, 250, 245, 0.9)" }}
              >
                <p
                  className="uppercase font-semibold text-[10px] tracking-[0.15em]"
                  style={{ color: "rgba(220, 245, 235, 0.75)" }}
                >
                  S/O
                </p>
                <p className="font-normal tracking-wide">
                  {groomData.fatherName}
                </p>
                <p className="font-normal tracking-wide">
                  {groomData.motherName}
                </p>
              </div>
            </div>
            {/* END: Groom Card */}

            {/* BEGIN: Bride Card */}
            <div className="wedding-glass-card rounded-[24px] px-6 py-4 sm:py-5 text-center w-full shadow-2xl">
              <p
                className="uppercase font-semibold mb-1 tracking-[0.18em] text-[11px] sm:text-[12px] font-sans"
                style={{ color: "rgba(220, 245, 235, 0.85)" }}
              >
                THE BRIDE
              </p>
              <h2
                className="font-medium my-0 mb-2 leading-tight"
                style={{
                  color: "#ccff00",
                  fontSize: "36px",
                  letterSpacing: "-0.01em",
                  textShadow: "0 0 16px rgba(200, 255, 0, 0.35)",
                  fontFamily: '"Prata", "Cinzel", "Playfair Display", Georgia, serif',
                }}
              >
                {brideData.name}
              </h2>
              <div
                className="space-y-[2px] leading-relaxed font-sans text-[12px] sm:text-[13px]"
                style={{ color: "rgba(240, 250, 245, 0.9)" }}
              >
                <p
                  className="uppercase font-semibold text-[10px] tracking-[0.15em]"
                  style={{ color: "rgba(220, 245, 235, 0.75)" }}
                >
                  D/O
                </p>
                <p className="font-normal tracking-wide">
                  {brideData.fatherName}
                </p>
                <p className="font-normal tracking-wide">
                  {brideData.motherName}
                </p>
              </div>
            </div>
            {/* END: Bride Card */}
          </div>

          {/* Empty bottom space allowing the couple sitting on the bench to be fully visible */}
          <div aria-hidden="true" className="w-full h-1/2 pointer-events-none" />
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SCREEN 4: THE NIKAH CEREMONY DETAILS (NEW SCROLL SECTION)
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-ceremony-details"
          className="relative w-full h-full min-h-full snap-start snap-always shrink-0 flex flex-col justify-between items-center text-center px-4 sm:px-5 pt-10 sm:pt-11 pb-2"
        >
          <div className="w-full max-w-[290px] flex flex-col items-center gap-2 z-10 pb-6">
            {/* ── CARD 1: THE NIKAH CEREMONY ── */}
            <div className="glass-panel w-full rounded-2xl px-3 py-3 flex flex-col items-center text-center tracking-normal">
              {/* Header */}
              <div className="mb-2">
                <h2
                  className="text-sm sm:text-base font-bold text-white tracking-[0.08em] drop-shadow-sm uppercase"
                  style={{ fontFamily: '"Cinzel", "Playfair Display", Georgia, serif' }}
                >
                  {ceremonyDetails1.title}
                </h2>
                <p className="text-[9px] sm:text-[9.5px] text-[#d6ff00] font-extrabold tracking-[0.1em] uppercase mt-0.5 font-sans">
                  {ceremonyDetails1.subtitle}
                </p>
              </div>

              {/* Information List */}
              <div className="w-full flex flex-col gap-2 text-left px-0.5 mb-3">
                {/* Item 1: Date */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <Calendar className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails1.dateText}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] text-[#d6ff00] font-bold uppercase tracking-wider mt-0.5 font-sans">
                      {ceremonyDetails1.hijriDate}
                    </span>
                  </div>
                </div>

                {/* Item 2: Time */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <Clock className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails1.timeText}
                    </span>
                  </div>
                </div>

                {/* Item 3: Location */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <MapPin className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails1.venueName}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] text-[#d6ff00] font-semibold tracking-normal mt-0.5 leading-snug font-sans">
                      {ceremonyDetails1.venueAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#d6ff00] hover:bg-[#c2e800] active:scale-[0.98] transition-all text-[#152e2a] text-[8px] sm:text-[8.5px] font-extrabold py-1.5 px-1 rounded-full text-center shadow-lg whitespace-nowrap font-sans cursor-pointer"
                >
                  Save to Calendar
                </a>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="bg-white hover:bg-slate-100 active:scale-[0.98] transition-all text-[#152e2a] text-[8px] sm:text-[8.5px] font-extrabold py-1.5 px-1 rounded-full text-center shadow-lg whitespace-nowrap font-sans cursor-pointer"
                >
                  Track Location
                </button>
              </div>
            </div>

            {/* ── CARD 2: CEREMONY / RECEPTION (Matching mockup's 2nd card) ── */}
            <div className="glass-panel w-full rounded-2xl px-3 py-3 flex flex-col items-center text-center tracking-normal">
              {/* Header */}
              <div className="mb-2">
                <h2
                  className="text-sm sm:text-base font-bold text-white tracking-[0.08em] drop-shadow-sm uppercase"
                  style={{ fontFamily: '"Cinzel", "Playfair Display", Georgia, serif' }}
                >
                  {ceremonyDetails2.title}
                </h2>
                <p className="text-[9px] sm:text-[9.5px] text-[#d6ff00] font-extrabold tracking-[0.1em] uppercase mt-0.5 font-sans">
                  {ceremonyDetails2.subtitle}
                </p>
              </div>

              {/* Information List */}
              <div className="w-full flex flex-col gap-2 text-left px-0.5 mb-3">
                {/* Item 1: Date */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <Calendar className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails2.dateText}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] text-[#d6ff00] font-bold uppercase tracking-wider mt-0.5 font-sans">
                      {ceremonyDetails2.hijriDate}
                    </span>
                  </div>
                </div>

                {/* Item 2: Time */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <Clock className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails2.timeText}
                    </span>
                  </div>
                </div>

                {/* Item 3: Location */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <MapPin className="w-3 h-3 text-[#133c37]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white leading-tight font-sans">
                      {ceremonyDetails2.venueName}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] text-[#d6ff00] font-semibold tracking-normal mt-0.5 leading-snug font-sans">
                      {ceremonyDetails2.venueAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#d6ff00] hover:bg-[#c2e800] active:scale-[0.98] transition-all text-[#152e2a] text-[8px] sm:text-[8.5px] font-extrabold py-1.5 px-1 rounded-full text-center shadow-lg whitespace-nowrap font-sans cursor-pointer"
                >
                  Save to Calendar
                </a>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="bg-white hover:bg-slate-100 active:scale-[0.98] transition-all text-[#152e2a] text-[8px] sm:text-[8.5px] font-extrabold py-1.5 px-1 rounded-full text-center shadow-lg whitespace-nowrap font-sans cursor-pointer"
                >
                  Track Location
                </button>
              </div>
            </div>

            {/* Bottom spacer allowing focus on couple sitting on bench */}
            <div aria-hidden="true" className="w-full h-24 sm:h-32 shrink-0 pointer-events-none" />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SCREEN 5: BLESSINGS FOR THE COUPLE
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-blessings"
          className="relative w-full h-full min-h-full snap-start snap-always shrink-0 flex flex-col items-center text-center px-6 pt-[12vh]"
        >
          <div className="relative z-10 flex w-full max-w-[320px] flex-col items-center">
            <h2
              className="text-[15px] sm:text-base font-bold uppercase leading-snug tracking-[0.08em] text-[#d6ff00]"
              style={{ fontFamily: '"Cinzel", "Playfair Display", Georgia, serif' }}
            >
              Written in the Stars,
              <br />
              Blessed by Allah
            </h2>

            <p className="mt-4 max-w-[300px] text-[11px] sm:text-xs leading-[1.65] text-white/90 font-sans">
              {blessingDetails.message}
            </p>

            <blockquote className="mt-7 text-[11px] leading-snug text-[#d6ff00]">
              &ldquo;{blessingDetails.verse}&rdquo;
              <cite className="mt-1.5 block text-[9px] not-italic uppercase tracking-wide text-white/90">
                — {blessingDetails.verseReference}
              </cite>
            </blockquote>

            <button
              type="button"
              onClick={() => setBlessingCount((count) => count + 1)}
              className="mt-7 w-full max-w-[240px] rounded-full bg-[#d6ff00] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#152e2a] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none"
              aria-live="polite"
            >
              {blessingCount > 0
                ? `Bless the Couple · ${blessingCount}`
                : "Bless the Couple"}
            </button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SCREEN 6: INVITATION CLOSING
            ───────────────────────────────────────────────────────────── */}
        <section
          id="screen-conclusion"
          className="relative z-10 flex h-full min-h-full w-full snap-start snap-always shrink-0 flex-col items-center justify-between bg-[#062c2b] px-6 pb-7 pt-[7vh] text-center"
        >
          <div className="flex w-full max-w-[320px] flex-col items-center">
            <h2 className="on-chair-names text-[44px] sm:text-[52px] font-bold tracking-tight leading-[0.88]">
              {groomData.name}
            </h2>
            <div className="-my-1.5 sm:-my-2 z-20">
              <span className="on-chair-script relative top-[5px] text-[36px] sm:text-[42px] text-white font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-none inline-block">
                weds
              </span>
            </div>
            <h2 className="on-chair-names relative -top-[10px] text-[44px] sm:text-[52px] font-bold tracking-tight leading-[0.88]">
              {brideData.name}
            </h2>

            <p
              dir="rtl"
              lang="ar"
              className="on-chair-arabic mt-8 text-[17px] leading-relaxed text-[#e2c47a]"
            >
              {blessingDetails.arabicDua}
            </p>
            <p className="mt-4 text-[11px] leading-[1.7] text-white/65 font-sans">
              {blessingDetails.closingMessage}
            </p>

            <button
              type="button"
              onClick={handleShareOnWhatsApp}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#d6ff00] px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#062c2b] transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Share Invitation on WhatsApp
            </button>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="mt-3 w-full rounded-full border border-white/80 bg-white px-5 py-2.5 text-[10px] font-medium text-[#062c2b] transition-colors hover:bg-white/90 motion-reduce:transition-none"
              aria-live="polite"
            >
              {inviteLinkCopied ? "Invite Link Copied" : "Copy Invite Link"}
            </button>
            {inviteLinkCopyError && (
              <p className="mt-2 text-[10px] text-red-200" role="status">
                Could not copy the invite link. Please try again.
              </p>
            )}
          </div>

          <footer className="w-full max-w-[320px] border-t border-white/10 pt-5 text-[9px] leading-relaxed text-white/40">
            <p>With love and heartfelt prayers from both families</p>
            <p className="mt-1">Invited with love &amp; joy</p>
            <p className="mt-3 text-white/30">
              Created with devotion for this occasion
            </p>
          </footer>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: LOCATION MODAL
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLocationModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.94, y: 14, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 14, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[340px] bg-[#0c1819]/95 border border-white/20 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                aria-label="Close dialog"
                className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all text-xs"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Icon */}
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white mb-2.5 shadow-inner">
                <Navigation className="w-5 h-5 text-[#ccff00]" />
              </div>

              <h3 className="text-base font-bold text-white tracking-wide font-sans">
                CK Convention Center
              </h3>
              <p className="text-[11px] text-white/70 font-sans">
                Chavakkad, Thrissur, Kerala
              </p>

              {/* Stylized Map Preview Card with Animated Radar Pin */}
              <div className="w-full h-24 rounded-2xl bg-neutral-900 border border-white/15 my-3 relative overflow-hidden flex flex-col justify-end p-2.5">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                {/* Center Animated Pin */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-lime-400/25 animate-ping" />
                    <MapPin className="w-7 h-7 text-[#ccff00] drop-shadow-[0_2px_8px_rgba(204,255,0,0.6)]" />
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between text-[10px] bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1 border border-white/10">
                  <span className="text-white/80 truncate">Chavakkad Bypass Road</span>
                  <span className="lime-accent font-semibold flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Navigate
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-white text-neutral-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow hover:bg-neutral-100 active:scale-95 transition-all font-sans"
                >
                  <MapPin className="w-4 h-4 text-red-600" />
                  Open in Google Maps
                </a>

                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-white/15 hover:bg-white/20 active:scale-95 text-white border border-white/15 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all font-sans"
                >
                  <Navigation className="w-4 h-4 text-sky-400" />
                  Open in Apple Maps
                </a>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all font-sans"
                >
                  {addressCopied ? (
                    <>
                      <Check className="w-4 h-4 text-[#ccff00]" />
                      <span className="text-[#ccff00] font-semibold">Address Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="mt-2.5 text-[11px] text-white/50 hover:text-white transition-colors font-sans"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
