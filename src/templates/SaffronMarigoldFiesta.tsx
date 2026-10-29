"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Heart,
  Sparkles,
  Share2,
  Plane,
  Train,
  CheckCircle2,
  Maximize2,
  X,
  Send,
  Sun,
  Flame,
} from "lucide-react";
import type { WeddingTemplateProps, VenueEvent } from "@/types/wedding";
import { AddToCalendarButton } from "@/components/shared/AddToCalendarButton";
import { GoogleMapCard } from "@/components/shared/GoogleMapCard";

interface NormalizedEvent {
  id: string;
  eventName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  dressCode?: string;
  venueName: string;
  venueAddress: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  googleMapsUrl: string;
}

interface NormalizedStoryItem {
  id: string;
  year?: string;
  title: string;
  description: string;
  imageUrl?: string;
}

function formatDateUTC(dateStr?: string, format: "short" | "full" = "full"): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      if (!isNaN(d.getTime())) {
        if (format === "short") {
          return d.toLocaleDateString("en-US", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
        return d.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: format === "short" ? "short" : "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) return timeStr;
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export default function SaffronMarigoldFiesta({
  data,
  weddingId = "wedding",
  isPreview = false,
  onRsvpSubmit,
  onTrackEvent,
}: WeddingTemplateProps) {
  const rawData = data as any;
  const sections = (rawData.sections as any) || {};
  const showCountdown = sections.showCountdown !== false;
  const showStory = sections.showStory !== false;
  const showGallery = sections.showGallery !== false;
  const showEvents = sections.showEvents !== false;
  const showRsvp = sections.showRsvp !== false && Boolean(rawData.rsvpConfig?.enabled !== false);
  const showMusic = sections.showMusic !== false;

  const couple = {
    brideName: rawData.couple?.brideName || "The Bride",
    groomName: rawData.couple?.groomName || "The Groom",
    brideBio: rawData.couple?.brideBio || "",
    groomBio: rawData.couple?.groomBio || "",
    bridePhoto:
      rawData.couple?.bridePhoto ||
      rawData.couple?.coverPhotoUrl ||
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    groomPhoto:
      rawData.couple?.groomPhoto ||
      rawData.couple?.coverPhotoUrl ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    hashtag: rawData.couple?.hashtag || "#SaffronFiesta",
    weddingDate: rawData.couple?.weddingDate || "2026-12-14",
    coverPhotoUrl: rawData.couple?.coverPhotoUrl || "",
  };

  const hero = {
    coverPhoto:
      rawData.hero?.coverPhoto ||
      rawData.couple?.coverPhotoUrl ||
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
    tagline:
      rawData.hero?.tagline ||
      "Under the joyful blessings of family and traditions, celebrate this vibrant festivity of eternal love.",
    bgMusicUrl:
      rawData.hero?.bgMusicUrl ||
      rawData.theme?.backgroundMusicUrl ||
      "",
  };

  const storyItems: NormalizedStoryItem[] = useMemo(() => {
    if (Array.isArray(rawData.story)) {
      return rawData.story.map((s: any, idx: number) => ({
        id: s.id || `story-${idx}`,
        year: s.year || "",
        title: s.title || "",
        description: s.description || s.content || "",
        imageUrl: s.imageUrl,
      }));
    }
    if (rawData.story?.milestones && Array.isArray(rawData.story.milestones)) {
      return rawData.story.milestones.map((m: any, idx: number) => ({
        id: `milestone-${idx}`,
        year: m.year || "",
        title: m.title || "",
        description: m.description || "",
      }));
    }
    if (rawData.story?.content) {
      return [
        {
          id: "story-1",
          year: "Our Journey",
          title: rawData.story.title || "How We Met",
          description: rawData.story.content,
        },
      ];
    }
    return [];
  }, [rawData.story]);

  const rawEventsList = Array.isArray(rawData.events) ? rawData.events : [];
  const events: NormalizedEvent[] = useMemo(() => {
    if (rawEventsList.length === 0) {
      return [
        {
          id: "evt-nikah",
          eventName: "Holy Nikah Vows",
          title: "Holy Nikah Vows",
          date: couple.weddingDate,
          startTime: "10:30",
          endTime: "13:00",
          dressCode: "Sunny Marigold & Saffron Festive Wear",
          venueName: "Rose Lounge Convention Center",
          venueAddress: "Kozhikode Bypass Road, Calicut, Kerala",
          googleMapsUrl: "",
        },
        {
          id: "evt-reception",
          eventName: "Wedding Reception",
          title: "Wedding Reception",
          date: couple.weddingDate,
          startTime: "18:30",
          endTime: "22:00",
          dressCode: "Terracotta Rust & Warm Sand Elegance",
          venueName: "Grand Malabar Banquet Hall",
          venueAddress: "Tirur - Calicut Highway, Malappuram, Kerala",
          googleMapsUrl: "",
        },
      ];
    }

    return rawEventsList.map((evt: any, idx: number) => {
      const venueObj = evt.venue || {};
      const title = evt.title || evt.eventName || `Ceremony ${idx + 1}`;
      return {
        id: evt.id || `evt-${idx}`,
        eventName: title,
        title,
        date: typeof evt.date === "string" ? evt.date : couple.weddingDate,
        startTime: evt.startTime || "10:00",
        endTime: evt.endTime || "13:00",
        dressCode: evt.dressCode || "",
        venueName: venueObj.name || evt.venueName || "Celebration Hall",
        venueAddress: venueObj.address || evt.venueAddress || "Kerala, India",
        lat: venueObj.lat ?? evt.lat,
        lng: venueObj.lng ?? evt.lng,
        googlePlaceId: venueObj.placeId ?? evt.googlePlaceId,
        googleMapsUrl: venueObj.googleMapsUrl || evt.googleMapsUrl || "",
      };
    });
  }, [rawEventsList, couple.weddingDate]);

  const gallery: string[] = useMemo(() => {
    if (Array.isArray(rawData.gallery) && rawData.gallery.length > 0) {
      return rawData.gallery;
    }
    return [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=800&q=80",
    ];
  }, [rawData.gallery]);

  const rsvpConfig = {
    enabled: rawData.rsvpConfig?.enabled !== false,
    deadline: rawData.rsvpConfig?.deadline || "",
    askMealPreference: Boolean(
      rawData.rsvpConfig?.askMealPreference || rawData.rsvpConfig?.askDietaryPreference
    ),
    askPlusOnes: Boolean(rawData.rsvpConfig?.askPlusOnes ?? true),
    whatsappNumber: rawData.rsvpConfig?.whatsappNumber || "",
  };

  const [isOpen, setIsOpen] = useState(isPreview);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [blessingCount, setBlessingCount] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestDua, setGuestDua] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!couple.weddingDate) return;
    const calculateCountdown = () => {
      const parts = couple.weddingDate.split("-");
      let targetTime = 0;
      if (parts.length === 3) {
        targetTime = Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 4, 30, 0);
      } else {
        targetTime = new Date(`${couple.weddingDate}T10:00:00+05:30`).getTime();
      }
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [couple.weddingDate]);

  const handleOpenInvitation = () => {
    setIsOpen(true);
    if (showMusic && hero.bgMusicUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(hero.bgMusicUrl);
        audioRef.current.loop = true;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleAudio = () => {
    if (!showMusic || !hero.bgMusicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(hero.bgMusicUrl);
      audioRef.current.loop = true;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSendBlessing = (e: React.FormEvent) => {
    e.preventDefault();
    setBlessingCount((prev) => prev + 1);
    setToastMessage(guestName.trim() ? `Shukran, ${guestName}! Your festive blessing has been recorded.` : "Shukran! Your blessing has been warmly received.");
    setShowToast(true);
    setGuestDua("");
    onTrackEvent?.("rsvp_submit");
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const getInitials = (g: string, b: string) => {
    const gi = (g || "G").trim().charAt(0).toUpperCase();
    const bi = (b || "B").trim().charAt(0).toUpperCase();
    return `${gi}&${bi}`;
  };

  return (
    <div className="relative min-h-screen bg-[#FEF9EE] text-[#3E1103] font-serif antialiased selection:bg-amber-300 selection:text-orange-950">
      <style>{`
        .genda-string {
          background-image: radial-gradient(circle, #F59E0B 42%, #EA580C 72%, transparent 75%);
          background-size: 16px 16px;
        }
        .marigold-glow {
          box-shadow: 0 10px 30px -5px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(234, 88, 12, 0.15);
        }
      `}</style>

      {/* ── 1. TAP TO OPEN SPLASH OVERLAY ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#7C2D12] p-4 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25)_0%,transparent_75%)] pointer-events-none" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#EA580C] via-[#C2410C] to-[#7C2D12] border-2 border-amber-300 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-amber-300 bg-[#7C2D12] flex items-center justify-center shadow-inner">
                <span className="text-amber-200 text-2xl font-bold italic">
                  {getInitials(couple.groomName, couple.brideName)}
                </span>
              </div>
              <p className="text-amber-200 text-xs uppercase tracking-widest font-sans font-semibold mb-2">
                Saffron &amp; Marigold Fiesta
              </p>
              <h2 className="text-3xl text-white font-serif font-bold mb-3 drop-shadow">
                {couple.groomName} <span className="text-amber-300">&</span> {couple.brideName}
              </h2>
              <p className="text-amber-100/90 text-xs font-sans mb-6 leading-relaxed">
                Join our cheerful wedding celebration filled with colors of marigold, joy, and blessings.
              </p>
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 text-[#7C2D12] font-sans text-xs font-bold uppercase tracking-widest shadow-lg hover:brightness-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>🌼</span>
                <span>Open Wedding Invitation</span>
                <span>🌼</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. STICKY TOP NAVIGATION BAR ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#C2410C]/95 backdrop-blur-md border-b border-amber-300/50 shadow-md">
        <div className="w-full max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full border-2 border-amber-300 bg-[#7C2D12] flex items-center justify-center shadow-inner">
              <span className="text-[14px] text-amber-200 font-bold italic leading-none">
                {getInitials(couple.groomName, couple.brideName)}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-[11px] uppercase tracking-widest text-amber-100 font-semibold leading-tight">
                {couple.groomName} &amp; {couple.brideName}
              </span>
              <span className="font-sans text-[10px] tracking-wider text-amber-300 leading-tight">
                {formatDateUTC(couple.weddingDate, "short")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#events"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-[#7C2D12] font-sans text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm hover:brightness-105 transition-all duration-200"
            >
              Save Date
            </a>
            {showMusic && hero.bgMusicUrl && (
              <button
                type="button"
                onClick={toggleAudio}
                className="w-8 h-8 rounded-full bg-[#7C2D12] border border-amber-300/60 flex items-center justify-center text-amber-200 hover:bg-[#9A3412] transition-colors"
                title={isPlaying ? "Mute Music" : "Play Music"}
                aria-label={isPlaying ? "Mute Music" : "Play Music"}
              >
                {isPlaying ? <Volume2 className="w-4 h-4 text-amber-200" /> : <VolumeX className="w-4 h-4 text-amber-200/60" />}
              </button>
            )}
            <a
              href="#blessings"
              className="w-8 h-8 rounded-full bg-[#7C2D12] border border-amber-300/60 flex items-center justify-center text-amber-200 hover:bg-[#9A3412] transition-colors"
              aria-label="Offer Blessings"
            >
              <Heart className="w-4 h-4 text-amber-300 fill-amber-300" />
            </a>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN CONTENT CONTAINER ── */}
      <main className="w-full pt-16 bg-[#FEF9EE] min-h-screen">
        <div className="flex flex-col w-full">
          {/* Festive Marigold Garland Band */}
          <div className="w-full relative h-7 bg-amber-100/80 border-b border-amber-300/50 flex items-center justify-around overflow-hidden px-2">
            <div className="flex items-center gap-3 text-amber-600 opacity-90 text-[11px]">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>🌼</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#C2410C] font-semibold">
                Shubh Nikah &amp; Feast Celebration
              </span>
              <span>🌼</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* ── 4. HERO SECTION WITH DECORATED PORTRAIT & BISMILLAH ── */}
          <section className="relative w-full pt-8 pb-10 px-4 flex flex-col items-center text-center overflow-hidden">
            {/* Arabic Bismillah Pill with Brass Diyas */}
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border border-amber-400 rounded-full shadow-sm mb-6">
              <span className="text-sm">🪔</span>
              <span className="text-[#C2410C] text-lg md:text-xl font-serif font-bold tracking-widest select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span className="text-sm">🪔</span>
            </div>

            {/* Decorated Portrait with Marigold String Border & Lantern Accents */}
            <div className="relative w-full max-w-sm aspect-[4/5] bg-gradient-to-b from-amber-200 via-orange-200 to-amber-300 rounded-2xl p-2.5 mb-6 marigold-glow border border-amber-400">
              {/* Top Tag Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#C2410C] text-white px-4 py-1 rounded-full border border-amber-300 text-[10px] font-mono uppercase tracking-widest shadow-md flex items-center gap-1.5 z-20">
                <span>🌼</span>
                <span>Sacred Matrimony</span>
                <span>🌼</span>
              </div>

              {/* Photo Frame */}
              <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={couple.coverPhotoUrl || couple.bridePhoto || couple.groomPhoto}
                  alt={`${couple.groomName} & ${couple.brideName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#7C2D12]/85 via-transparent to-transparent pointer-events-none" />

                {/* Bottom Caption */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white text-left z-20">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-200 flex items-center gap-1 font-bold">
                      <span>✨</span> Festive Portrait
                    </span>
                    <span className="font-serif text-[20px] italic leading-tight text-white font-medium drop-shadow">
                      {couple.groomName} &amp; {couple.brideName}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#C2410C]/90 border border-amber-300 flex items-center justify-center text-[10px] text-amber-200 font-mono font-bold shadow-md">
                    {getInitials(couple.groomName, couple.brideName)}
                  </div>
                </div>
              </div>
            </div>

            {/* Couple Names & Tagline */}
            <div className="max-w-md mx-auto mb-6">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                The Festive Celebration
              </span>
              <h1 className="text-3xl md:text-4xl text-[#7C2D12] font-serif font-bold tracking-tight mb-2">
                {couple.groomName} <span className="text-amber-500 font-normal">&amp;</span> {couple.brideName}
              </h1>
              <p className="font-sans text-xs text-amber-950/80 max-w-sm mx-auto leading-relaxed">
                {hero.tagline}
              </p>
            </div>

            {/* ── 5. LIVE COUNTDOWN FESTIVE CARD ── */}
            {showCountdown && (
              <div className="w-full max-w-sm bg-gradient-to-b from-amber-50 to-[#FEF3D6] p-4 mb-5 border-2 border-amber-300 rounded-xl shadow-md text-center">
                <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 text-sm">🪘</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                      Days Until Nikah Ceremony
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-bold">
                    {formatDateUTC(couple.weddingDate, "short")}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#7C2D12] leading-none mb-1">
                      {timeLeft.days}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800/80">
                      Days
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#7C2D12] leading-none mb-1">
                      {timeLeft.hours}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800/80">
                      Hours
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#7C2D12] leading-none mb-1">
                      {timeLeft.minutes}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800/80">
                      Mins
                    </span>
                  </div>
                  <div className="bg-gradient-to-br from-[#EA580C] to-[#C2410C] p-2.5 rounded-lg border border-amber-300 shadow-sm flex flex-col items-center text-white">
                    <span className="text-2xl font-mono font-bold text-amber-100 leading-none mb-1 animate-pulse">
                      {timeLeft.seconds}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-200">
                      Secs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── 6. LINEAGE SECTION WITH FESTIVE TERRACOTTA ACCENT ── */}
          <section className="w-full bg-gradient-to-b from-[#FEF4DC] to-[#FDF0CE] py-8 px-4 border-y border-amber-300/70">
            <div className="max-w-sm mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-amber-200/90 px-3 py-1 rounded-full mb-1 border border-amber-400/50">
                  <span className="text-amber-600 text-xs">✨</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                    Lineage &amp; Family
                  </span>
                  <span className="text-amber-600 text-xs">✨</span>
                </div>
                <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mt-1">
                  Honouring the Families
                </h2>
                <div className="w-16 h-0.5 bg-amber-400 my-2" />
                <p className="font-sans text-xs text-amber-900/80">
                  Joined in shared faith, vibrant joy, and noble lineage.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Groom's Card */}
                <div className="bg-gradient-to-br from-white to-amber-50/90 p-5 rounded-2xl border-2 border-amber-300 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                      Groom &amp; Household
                    </span>
                    <span className="text-sm">🪔</span>
                  </div>
                  <h3 className="text-xl text-[#7C2D12] font-serif font-bold mb-1">
                    {couple.groomName}
                  </h3>
                  <p className="font-sans text-xs text-amber-900 leading-relaxed">
                    {couple.groomBio || "Warmly accompanied by beloved parents, elders, and kin in gratitude for this joyous milestone."}
                  </p>
                </div>

                {/* Bride's Card */}
                <div className="bg-gradient-to-br from-white to-amber-50/90 p-5 rounded-2xl border-2 border-amber-300 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                      Bride &amp; Household
                    </span>
                    <span className="text-sm">🪔</span>
                  </div>
                  <h3 className="text-xl text-[#7C2D12] font-serif font-bold mb-1">
                    {couple.brideName}
                  </h3>
                  <p className="font-sans text-xs text-amber-900 leading-relaxed">
                    {couple.brideBio || "Cherished daughter embraced with infinite maternal love, prayers, and celebratory blessings."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 7. STORY / MILESTONES SECTION ── */}
          {showStory && storyItems.length > 0 && (
            <section className="w-full bg-[#FEF9EE] py-8 px-4">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                  Our Journey of Love
                </span>
                <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mb-6">
                  Cherished Milestones
                </h2>

                <div className="space-y-4 text-left">
                  {storyItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 bg-white border border-amber-300 rounded-xl shadow-sm">
                      {item.year && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-bold block mb-1">
                          {item.year}
                        </span>
                      )}
                      <h4 className="text-lg text-[#7C2D12] font-serif font-bold mb-1">
                        {item.title}
                      </h4>
                      <p className="font-sans text-xs text-amber-900/90 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 8. EVENT SCHEDULE SECTION ── */}
          {showEvents && (
            <section className="w-full py-8 px-4 bg-[#FEF4DC] border-y border-amber-300" id="events">
              <div className="max-w-sm mx-auto">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-amber-200 px-3 py-1 rounded-full mb-1 border border-amber-400/50">
                    <span className="text-amber-600 text-xs">🌼</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                      Festive Program
                    </span>
                    <span className="text-amber-600 text-xs">🌼</span>
                  </div>
                  <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mt-1">
                    Schedule of Festive Events
                  </h2>
                  <div className="w-16 h-0.5 bg-amber-400 my-2" />
                  <p className="font-sans text-xs text-amber-900/80">
                    Ceremonial passes for our cherished guests and well-wishers.
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  {events.map((evt, idx) => {
                    const venueEventObj: VenueEvent = {
                      id: evt.id,
                      eventName: evt.title || evt.eventName,
                      date: evt.date,
                      startTime: evt.startTime,
                      endTime: evt.endTime,
                      venueName: evt.venueName,
                      venueAddress: evt.venueAddress,
                      lat: evt.lat,
                      lng: evt.lng,
                      googleMapsUrl: evt.googleMapsUrl,
                    };

                    return (
                      <div
                        key={evt.id}
                        className="bg-white border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden"
                      >
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-4 py-2.5 flex items-center justify-between border-b border-amber-300 text-white">
                          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-amber-100">
                            Festive Pass • 0{idx + 1}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded border border-amber-200/50">
                            Honored Guest
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col gap-3">
                          <h3 className="text-xl text-[#7C2D12] font-serif font-bold">
                            {evt.title}
                          </h3>

                          {/* Date & Time */}
                          <div className="flex items-center gap-3 text-xs text-amber-900 font-sans">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                              <span className="font-semibold">{formatDateUTC(evt.date, "short")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                              <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                            </div>
                          </div>

                          {/* Venue Details */}
                          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-col gap-1">
                            <div className="flex items-start gap-1.5 text-xs text-[#7C2D12] font-bold">
                              <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                              <span>{evt.venueName}</span>
                            </div>
                            <p className="text-[11px] text-amber-900/80 font-sans pl-5 leading-normal">
                              {evt.venueAddress}
                            </p>
                          </div>

                          {evt.dressCode && (
                            <div className="text-[11px] font-sans text-amber-950 bg-amber-100/70 px-3 py-1 rounded-lg border border-amber-300">
                              <strong className="font-semibold">Dress Code:</strong> {evt.dressCode}
                            </div>
                          )}

                          {/* Cut Line */}
                          <div className="border-t border-dashed border-amber-300 my-1 relative">
                            <span className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] text-[#C2410C] font-mono">
                              ✂ ADMIT ONE CELEBRATION PASS
                            </span>
                          </div>

                          {/* Actions: Map Card & Calendar Button */}
                          <div className="pt-2 flex flex-col gap-2">
                            <GoogleMapCard event={venueEventObj} />
                            <AddToCalendarButton
                              event={venueEventObj}
                              brideName={couple.brideName}
                              groomName={couple.groomName}
                              weddingId={weddingId}
                              isPreview={isPreview}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── 9. VENUE ROUTE & TRANSIT HUBS ── */}
          <section className="w-full bg-[#FEF9EE] py-8 px-4">
            <div className="max-w-sm mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-amber-200 px-3 py-1 rounded-full mb-1 border border-amber-300">
                  <span className="text-sm">📍</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                    Celebration Locations
                  </span>
                  <span className="text-sm">📍</span>
                </div>
                <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mt-1">
                  Travel &amp; Route Guidance
                </h2>
                <div className="w-16 h-0.5 bg-amber-400 my-2" />
                <p className="font-sans text-xs text-amber-900/80">
                  Convenient transit and airport hubs for outstation attendees.
                </p>
              </div>

              {/* Transit Hubs */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-2xl border border-amber-300 shadow-sm mb-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C2410C] font-bold block mb-2">
                  Transit Hub Proximity
                </span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-200 shadow-sm">
                    <Plane className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <div>
                      <span className="font-sans text-[11px] font-bold text-[#7C2D12] block leading-tight">
                        Calicut (CCJ)
                      </span>
                      <span className="font-sans text-[9px] text-amber-800">~24 km (35 min)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-200 shadow-sm">
                    <Train className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <div>
                      <span className="font-sans text-[11px] font-bold text-[#7C2D12] block leading-tight">
                        Tirur Stn (TIR)
                      </span>
                      <span className="font-sans text-[9px] text-amber-800">~12 km (18 min)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 10. PHOTO GALLERY ── */}
          {showGallery && gallery.length > 0 && (
            <section className="w-full bg-[#FEF4DC] py-8 px-4 border-y border-amber-300">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                  Festive Snaps
                </span>
                <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mb-6">
                  Celebration Gallery
                </h2>

                <div className="grid grid-cols-2 gap-2.5">
                  {gallery.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImg(imgUrl)}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-amber-300 cursor-pointer shadow-sm group hover:scale-[1.02] transition-transform"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:brightness-105 transition-all"
                      />
                      <div className="absolute inset-0 bg-[#7C2D12]/0 group-hover:bg-[#7C2D12]/20 transition-all flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 11. QURAN VERSE & INTERACTIVE DUA SECTION ── */}
          <section className="w-full px-4 py-8 bg-[#FEF9EE]" id="blessings">
            <div className="max-w-sm mx-auto flex flex-col gap-6">
              {/* Surah Ar-Rum Card */}
              <div className="bg-gradient-to-br from-[#FEF3D6] via-[#FDE8BE] to-[#FED7AA] p-5 rounded-2xl border-2 border-amber-400 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 bg-amber-200/80 px-2.5 py-1 rounded-full">
                    <span className="text-amber-600 text-xs">📖</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold">
                      Surah Ar-Rum • 30:21
                    </span>
                  </div>
                  <span className="text-base">🌼</span>
                </div>
                <div className="text-center my-3">
                  <p className="text-[#7C2D12] text-lg font-serif leading-relaxed mb-2 font-medium">
                    وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
                  </p>
                  <p className="font-sans text-[11px] text-amber-950 italic leading-normal">
                    “And of His signs is that He created for you mates from among yourselves, that you may dwell in peace with them; and He placed between you love and compassion.”
                  </p>
                </div>
              </div>

              {/* Interactive Blessing Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md text-left">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-bold block">
                      Warm Felicitations
                    </span>
                    <h3 className="text-2xl text-[#7C2D12] font-serif font-bold">
                      Offer Your Blessings
                    </h3>
                  </div>
                  <span className="text-2xl">💐</span>
                </div>
                <p className="font-sans text-xs text-amber-900/80 mb-4 leading-normal">
                  Record your celebratory dua and heartfelt wishes for the bride &amp; groom.
                </p>

                <form onSubmit={handleSendBlessing} className="flex flex-col gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#C2410C] font-bold block mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Tariq &amp; Family"
                      className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl text-[#3E1103] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#C2410C] font-bold block mb-1">
                      Heartfelt Prayer &amp; Note
                    </label>
                    <textarea
                      rows={3}
                      value={guestDua}
                      onChange={(e) => setGuestDua(e.target.value)}
                      placeholder="May Allah bless this beautiful couple with unending joy, happiness, and prosperity..."
                      className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl text-[#3E1103] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    <span>Send Warm Blessing &amp; Dua</span>
                  </button>
                </form>

                {/* Counter */}
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between text-xs text-[#C2410C]">
                  <span className="font-sans text-[11px] font-medium">
                    {blessingCount > 0 ? `${blessingCount} Heartfelt Blessings Sent` : "Be the first to send your blessings"}
                  </span>
                  <span className="text-sm">🤲</span>
                </div>

                {/* Toast Notification */}
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-[#7C2D12] font-sans flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{toastMessage}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          {/* ── 12. RSVP SECTION ── */}
          {showRsvp && (
            <section className="w-full py-8 px-4 bg-[#FEF4DC] border-y border-amber-300" id="rsvp">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                  Respond with Joy
                </span>
                <h2 className="text-2xl text-[#7C2D12] font-serif font-bold mb-2">
                  RSVP &amp; Attendance
                </h2>
                {rsvpConfig.deadline && (
                  <p className="font-mono text-xs text-[#EA580C] uppercase tracking-wider mb-4">
                    Kindly respond by {formatDateUTC(rsvpConfig.deadline, "short")}
                  </p>
                )}

                <div className="mt-4 flex flex-col items-center gap-2">
                  {rsvpConfig.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Salaam! I would love to RSVP for ${couple.brideName} & ${couple.groomName}'s saffron and marigold wedding celebration.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrackEvent?.("rsvp_submit")}
                      className="w-full py-3 px-6 rounded-xl text-white text-xs font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-[#EA580C] via-[#C2410C] to-[#7C2D12] hover:brightness-105 shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-amber-300"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>RSVP via WhatsApp</span>
                    </a>
                  ) : isPreview ? (
                    <p className="text-xs text-[#C2410C] font-sans">
                      Add your WhatsApp number in the <strong>RSVP &amp; URL</strong> tab to enable guest responses.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          {/* ── 13. ATTIRE & OBSERVANCE PALETTE ── */}
          <section className="w-full bg-[#FEF3D6] py-7 px-4 border-y border-amber-300">
            <div className="max-w-sm mx-auto text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                Attire &amp; Observance
              </span>
              <p className="font-sans text-xs text-amber-950 mb-3.5">
                Warm festive elegance: Sunny marigold, saffron, terracotta rust, and ivory linen are warmly embraced.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm" />
                  <span className="font-mono text-[9px] text-[#7C2D12] font-semibold">Marigold</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#F97316] border-2 border-white shadow-sm" />
                  <span className="font-mono text-[9px] text-[#7C2D12] font-semibold">Saffron</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#C2410C] border-2 border-white shadow-sm" />
                  <span className="font-mono text-[9px] text-[#7C2D12] font-semibold">Terracotta</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#FEF9EE] border-2 border-amber-300 shadow-sm" />
                  <span className="font-mono text-[9px] text-[#7C2D12] font-semibold">Sand Linen</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 14. SUNNAH SUPPLICATION & HASHTAG BANNER ── */}
          <section className="w-full bg-gradient-to-b from-[#FEF9EE] to-amber-100 py-8 px-4 text-center">
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2 text-amber-600">
                <span className="text-base">🌼</span>
                <span className="w-8 h-0.5 bg-[#C2410C]/40" />
                <Sparkles className="w-4 h-4 text-[#C2410C]" />
                <span className="w-8 h-0.5 bg-[#C2410C]/40" />
                <span className="text-base">🌼</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#C2410C] font-bold block mb-2">
                Sunnah Matrimonial Supplication
              </span>
              <p className="text-xl md:text-2xl text-[#7C2D12] font-serif font-bold leading-relaxed mb-2">
                بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
              </p>
              <p className="font-sans text-[11px] text-amber-900 italic mb-4 max-w-xs mx-auto">
                “May Allah bless you, shower His blessings upon you, and unite you both in goodness.”
              </p>
              {couple.hashtag && (
                <div className="inline-block px-4 py-1.5 bg-[#C2410C] text-white border border-amber-300 rounded-full font-mono text-xs uppercase tracking-widest font-bold shadow-sm">
                  {couple.hashtag}
                </div>
              )}
            </div>
          </section>

          {/* ── 15. WARM FIESTA FOOTER ── */}
          <footer className="w-full bg-[#7C2D12] text-amber-100 border-t-2 border-amber-300">
            <div className="w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center text-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg italic text-amber-200 font-serif">
                  {couple.groomName} &amp; {couple.brideName}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">
                  Festive Celebration &amp; Eternal Joy
                </span>
              </div>
              <p className="font-sans text-[10px] text-amber-200/70">
                Shared with boundless love, smiles, and warm prayers from both families.
              </p>
            </div>
          </footer>
        </div>
      </main>

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-amber-300"
            onClick={() => setLightboxImg(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt="Enlarged photo"
            className="max-w-full max-h-[85vh] object-contain rounded-xl border border-amber-400"
          />
        </div>
      )}
    </div>
  );
}
