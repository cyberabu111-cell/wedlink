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
  Compass,
  Mail,
  Send,
  CheckCircle2,
  Music,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import type { WeddingTemplateProps, VenueEvent } from "@/types/wedding";
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  getGoogleMapsDirectionUrl,
  EmbeddedMap,
} from "@/components/shared/WeddingActionHelpers";

/* ─────────────────────────────────────────────────────────────
   HELPERS & DATA NORMALIZERS
   Gracefully handles both the standard WeddingData schema and
   the extended AI prompt contract without data loss.
   ───────────────────────────────────────────────────────────── */

interface NormalizedEvent {
  id: string;
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

function formatDate(dateStr?: string): string {
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

function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) return timeStr;
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export default function MalabarRoyalGold({
  data,
  isPreview = false,
  onRsvpSubmit,
}: WeddingTemplateProps) {
  /* ── 0. Section Visibility Flags ── */
  const rawData = data as any;
  const sections = (rawData.sections as any) || {};
  const showCountdown = sections.showCountdown !== false;
  const showStory = sections.showStory !== false;
  const showGallery = sections.showGallery !== false;
  const showEvents = sections.showEvents !== false;
  const showRsvp = sections.showRsvp !== false && Boolean(rawData.rsvpConfig?.enabled !== false);
  const showMusic = sections.showMusic !== false;

  /* ── 1. Adapt and Normalize Data safely ── */

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
    hashtag: rawData.couple?.hashtag || "#RoyalNikah",
    weddingDate: rawData.couple?.weddingDate || "2026-12-14",
  };

  const hero = {
    coverPhoto:
      rawData.hero?.coverPhoto ||
      rawData.couple?.coverPhotoUrl ||
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
    tagline:
      rawData.hero?.tagline ||
      "Together with their families, invite you to share in the joy of their wedding celebration.",
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

  const events: NormalizedEvent[] = useMemo(() => {
    if (!Array.isArray(rawData.events)) return [];
    return rawData.events.map((evt: any, idx: number) => {
      const venueObj = evt.venue || {};
      return {
        id: evt.id || `evt-${idx}`,
        title: evt.title || evt.eventName || `Ceremony ${idx + 1}`,
        date: typeof evt.date === "string" ? evt.date : couple.weddingDate,
        startTime: evt.startTime || "10:00",
        endTime: evt.endTime || "13:00",
        dressCode: evt.dressCode || "",
        venueName: venueObj.name || evt.venueName || "Grand Banquet Hall",
        venueAddress: venueObj.address || evt.venueAddress || "Kerala, India",
        lat: venueObj.lat ?? evt.lat,
        lng: venueObj.lng ?? evt.lng,
        googlePlaceId: venueObj.placeId ?? evt.googlePlaceId,
        googleMapsUrl: venueObj.googleMapsUrl || evt.googleMapsUrl || "",
      };
    });
  }, [rawData.events, couple.weddingDate]);

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

  /* ── 2. Interactive State: Splash Envelope, Audio, Countdown ── */
  const [isOpen, setIsOpen] = useState(isPreview); // In preview mode, allow direct view
  const [isPlaying, setIsPlaying] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer state
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
      const target = new Date(`${couple.weddingDate}T10:00:00+05:30`).getTime();
      const now = new Date().getTime();
      const difference = target - now;

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

  /* ── Audio controls with browser autoplay policy unlock ── */
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

  /* ── 3. RSVP Form Handling ── */
  const [rsvpState, setRsvpState] = useState({
    guestName: "",
    phone: "",
    attending: "yes",
    guestsCount: 1,
    mealPreference: "Traditional Kerala Sadya",
    message: "",
  });
  const [rsvpStatus, setRsvpStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleRsvpSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpState.guestName.trim()) return;

    setRsvpStatus("submitting");
    try {
      if (onRsvpSubmit) {
        await onRsvpSubmit(rsvpState);
      } else {
        // Fallback simulation delay
        await new Promise((res) => setTimeout(res, 800));
      }
      setRsvpStatus("success");
    } catch {
      setRsvpStatus("error");
    }
  };

  const whatsappUrl = useMemo(() => {
    if (!rsvpConfig.whatsappNumber) return "";
    const cleanPhone = rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Salaam! I would love to RSVP for ${couple.brideName} & ${couple.groomName}'s wedding.\nName: ${
        rsvpState.guestName || "Guest"
      }\nAttending: ${rsvpState.attending === "yes" ? "Joyfully Attending" : "Regretfully Declining"}\nGuests: ${
        rsvpState.guestsCount
      }`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  }, [rsvpConfig.whatsappNumber, couple.brideName, couple.groomName, rsvpState]);

  return (
    <div className="relative min-h-screen bg-[#FFFDF9] text-[#1A1A1A] font-serif antialiased selection:bg-[#D4AF37]/20 selection:text-[#996515]">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: ENVELOPE / SPLASH OPENING OVERLAY
          Unlocks audio autoplay on click with gold seal animation
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#14120e] p-4 text-center overflow-hidden"
          >
            {/* Subtle background ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18)_0%,transparent_70%)] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative max-w-md w-full bg-[#FFFDF9] rounded-2xl p-8 sm:p-10 shadow-2xl border-2 border-[#D4AF37]/50 text-[#1A1A1A] overflow-hidden"
            >
              {/* Kerala Kasavu Royal Ornamental Corner Borders */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]" />

              <div className="space-y-6">
                {/* Traditional Arabic / Royal Kerala Calligraphy Motif */}
                <div className="inline-block px-4 py-1 rounded-full bg-[#D4AF37]/10 text-[#996515] text-xs font-sans uppercase tracking-[0.25em] font-semibold border border-[#D4AF37]/30">
                  Royal Wedding Invitation
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-sans tracking-widest text-[#B8860B] uppercase">
                    In the Name of Allah, Most Gracious
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1A1A1A]">
                    {couple.brideName}
                    <span className="block text-xl sm:text-2xl text-[#D4AF37] italic my-1 font-serif">&</span>
                    {couple.groomName}
                  </h1>
                </div>

                <p className="text-xs font-sans text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Cordially invite you and your family to witness the sacred Nikah & wedding celebrations.
                </p>

                {/* Wax Seal Opening Button */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleOpenInvitation}
                    className="relative group inline-flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#B8860B] to-[#996515] text-white shadow-xl shadow-[#D4AF37]/30 border-2 border-[#FFFDF9] cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-full border border-white/40 flex flex-col items-center justify-center p-2 text-center">
                      <Sparkles className="w-5 h-5 text-amber-100 mb-0.5 animate-pulse" />
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-50">
                        Open
                      </span>
                    </div>
                  </motion.button>
                  <p className="text-[11px] font-sans text-stone-400 mt-3 tracking-wider uppercase">
                    Tap seal to open invitation
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          FLOATING AUDIO MUTE/UNMUTE BUTTON
          Fixed in corner, pulses when playing
          ───────────────────────────────────────────────────────────── */}
      {showMusic && hero.bgMusicUrl && (
        <aside aria-label="Audio controls">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            title={isPlaying ? "Mute Background Music" : "Play Background Music"}
            aria-label={isPlaying ? "Mute Background Music" : "Play Background Music"}
          >
            {isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
            ) : (
              <VolumeX className="w-5 h-5 text-white/80" />
            )}
          </motion.button>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: HERO & LIVE COUNTDOWN
          Opulent Malabar arch framing with live ticking timer
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 py-20 overflow-hidden border-b border-[#D4AF37]/30 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#FFFDF9]">
        {/* Subtle royal damask / kasavu background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-4xl mx-auto text-center space-y-8 z-10">
          {/* Traditional Calligraphy / Blessing Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-2"
          >
            <p className="text-xs font-sans uppercase tracking-[0.3em] text-[#B8860B] font-semibold">
              Bismillah-ir-Rahman-ir-Rahim
            </p>
            <p className="text-xs font-sans text-stone-500 tracking-widest uppercase">
              The Sacred Matrimony & Reception of
            </p>
          </motion.div>

          {/* Couple Names */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#1A1A1A] font-serif leading-none">
              <span>{couple.brideName}</span>
              <span className="inline-block text-[#D4AF37] italic mx-3 sm:mx-5 font-serif text-3xl sm:text-5xl">&</span>
              <span>{couple.groomName}</span>
            </h1>
            {couple.hashtag && (
              <p className="text-sm font-sans tracking-widest text-[#996515] uppercase font-medium">
                {couple.hashtag}
              </p>
            )}
          </motion.div>

          {/* Grand Arch Hero Portrait */}
          {hero.coverPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mx-auto max-w-sm sm:max-w-md"
            >
              {/* Outer Golden Kasavu Arch Border */}
              <div className="relative p-2 rounded-t-[140px] sm:rounded-t-[180px] rounded-b-2xl bg-gradient-to-b from-[#D4AF37]/50 via-[#B8860B]/30 to-transparent shadow-2xl">
                <div className="overflow-hidden rounded-t-[136px] sm:rounded-t-[176px] rounded-b-xl aspect-[3/4] border-2 border-[#D4AF37]/40 bg-stone-100">
                  <img
                    src={hero.coverPhoto}
                    alt={`${couple.brideName} and ${couple.groomName}`}
                    className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    loading="eager"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Wedding Date Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-3 pt-2"
          >
            <p className="text-lg sm:text-2xl font-serif text-[#1A1A1A] font-medium tracking-wide">
              {formatDate(couple.weddingDate)}
            </p>
            <p className="text-xs sm:text-sm font-sans text-stone-600 max-w-lg mx-auto leading-relaxed">
              {hero.tagline}
            </p>
          </motion.div>

          {/* Live Countdown Timer */}
          {showCountdown && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-4"
            >
              <div className="inline-grid grid-cols-4 gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Minutes", value: timeLeft.minutes },
                  { label: "Seconds", value: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[55px] sm:min-w-[75px]">
                    <span className="text-2xl sm:text-4xl font-serif font-semibold text-[#1A1A1A]">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs font-sans tracking-widest text-[#B8860B] uppercase font-medium mt-1">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: THE COUPLE & LOVE STORY
          Renders bride & groom profiles and milestone cards
          ───────────────────────────────────────────────────────────── */}
      {(couple.brideBio || couple.groomBio || (showStory && storyItems.length > 0)) && (
        <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-b border-[#D4AF37]/20">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#B8860B] font-semibold">
              Sacred Union
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
              The Bride & Groom
            </h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
          </div>

          {/* Couple Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-16">
            {/* Bride Card */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-md">
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-inner mb-6">
                <img
                  src={couple.bridePhoto}
                  alt={couple.brideName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-serif text-[#1A1A1A]">{couple.brideName}</h3>
              <p className="text-xs font-sans uppercase tracking-widest text-[#B8860B] mt-1 mb-4 font-semibold">
                The Bride
              </p>
              {couple.brideBio && (
                <p className="text-sm font-sans text-stone-600 leading-relaxed max-w-sm">
                  {couple.brideBio}
                </p>
              )}
            </div>

            {/* Groom Card */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-md">
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-inner mb-6">
                <img
                  src={couple.groomPhoto}
                  alt={couple.groomName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-serif text-[#1A1A1A]">{couple.groomName}</h3>
              <p className="text-xs font-sans uppercase tracking-widest text-[#B8860B] mt-1 mb-4 font-semibold">
                The Groom
              </p>
              {couple.groomBio && (
                <p className="text-sm font-sans text-stone-600 leading-relaxed max-w-sm">
                  {couple.groomBio}
                </p>
              )}
            </div>
          </div>

          {/* Story Milestones */}
          {showStory && storyItems.length > 0 && (
            <div className="space-y-8">
              <div className="text-center space-y-2 mb-10">
                <h3 className="text-2xl font-serif text-[#1A1A1A]">Our Journey of Love</h3>
                <p className="text-xs font-sans tracking-wider text-stone-500 uppercase">
                  Cherished Milestones on the Path to Forever
                </p>
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                {storyItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative pl-8 sm:pl-10 border-l-2 border-[#D4AF37]/40 py-2 group"
                  >
                    <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-[#FFFDF9] border-2 border-[#D4AF37] group-hover:bg-[#D4AF37] transition-colors" />
                    {item.year && (
                      <span className="text-xs font-sans font-bold text-[#B8860B] tracking-widest uppercase">
                        {item.year}
                      </span>
                    )}
                    <h4 className="text-xl font-serif text-[#1A1A1A] mt-1 mb-2">{item.title}</h4>
                    <p className="text-sm font-sans text-stone-600 leading-relaxed">{item.description}</p>
                    {item.imageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden max-w-sm border border-[#D4AF37]/30">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-44 object-cover" loading="lazy" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: EVENTS & VENUE CARDS (CRUCIAL)
          Calendar links, .ics download, Google Maps directions & embed
          ───────────────────────────────────────────────────────────── */}
      {showEvents && events.length > 0 && (
        <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-b border-[#D4AF37]/20">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#B8860B] font-semibold">
            Program & Schedule
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
            Wedding Celebrations
          </h2>
          <p className="text-xs font-sans text-stone-500 uppercase tracking-widest">
            Join us for each ceremonial step
          </p>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {events.map((evt) => {
            // Adapt to VenueEvent shape for Action Helpers
            const venueEventShape: VenueEvent = {
              id: evt.id,
              eventName: evt.title,
              date: evt.date,
              startTime: evt.startTime,
              endTime: evt.endTime,
              venueName: evt.venueName,
              venueAddress: evt.venueAddress,
              googleMapsUrl: evt.googleMapsUrl,
              dressCode: evt.dressCode,
              lat: evt.lat,
              lng: evt.lng,
              googlePlaceId: evt.googlePlaceId,
            };

            const googleCalUrl = getGoogleCalendarUrl(venueEventShape, couple);
            const directionsUrl = getGoogleMapsDirectionUrl(venueEventShape);

            return (
              <div
                key={evt.id}
                className="flex flex-col justify-between rounded-2xl bg-white border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5 p-6 sm:p-8 space-y-6"
              >
                <div className="space-y-4">
                  {/* Event Title & Dress Code Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-serif text-[#1A1A1A] font-medium">{evt.title}</h3>
                      <p className="text-xs font-sans font-semibold text-[#B8860B] uppercase tracking-wider mt-1">
                        {formatDate(evt.date)}
                      </p>
                    </div>
                    {evt.dressCode && (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-sans font-medium bg-[#D4AF37]/10 text-[#996515] border border-[#D4AF37]/30 whitespace-nowrap">
                        {evt.dressCode}
                      </span>
                    )}
                  </div>

                  {/* Timing & Venue details */}
                  <div className="space-y-2 text-xs font-sans text-stone-600 border-t border-b border-stone-100 py-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>
                        {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-stone-800">{evt.venueName}</p>
                        <p className="text-stone-500 leading-relaxed">{evt.venueAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Google Map Preview */}
                  <div className="rounded-xl overflow-hidden border border-stone-200">
                    <EmbeddedMap
                      lat={evt.lat}
                      lng={evt.lng}
                      venueName={evt.venueName}
                      venueAddress={evt.venueAddress}
                      googlePlaceId={evt.googlePlaceId}
                      className="w-full h-44 rounded-xl border-0"
                    />
                  </div>
                </div>

                {/* Calendar & Map Navigation Action Buttons */}
                <div className="space-y-3 pt-2">
                  {googleCalUrl ? (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-sans font-medium bg-[#FAF5EC] text-[#996515] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Add to calendar (Google)
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadIcsFile(venueEventShape, couple)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-sans font-medium bg-[#FAF5EC] text-[#996515] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Apple / Outlook (.ics)
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic">
                      Add a valid date to enable calendar links.
                    </p>
                  )}

                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-sans font-semibold bg-[#1A1A1A] text-white hover:bg-[#333333] transition-colors shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5 mr-2 text-[#D4AF37]" />
                      Get directions <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: PHOTO GALLERY
          Opulent gold border grid with lightbox expansion
          ───────────────────────────────────────────────────────────── */}
      {showGallery && gallery.length > 0 && (
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-[#D4AF37]/20">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#B8860B] font-semibold">
              Moments & Memories
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
              Photo Gallery
            </h2>
            <p className="text-xs font-sans text-stone-500 uppercase tracking-widest">
              Glimpses of our treasured chapter
            </p>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {gallery.map((imgUrl, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxImg(imgUrl)}
                className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-sm bg-stone-100"
              >
                <img
                  src={imgUrl}
                  alt={`Wedding memory ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lightbox Modal */}
          <AnimatePresence>
            {lightboxImg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxImg(null)}
                className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center cursor-zoom-out"
              >
                <button
                  onClick={() => setLightboxImg(null)}
                  className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
                >
                  <X className="w-7 h-7" />
                </button>
                <img
                  src={lightboxImg}
                  alt="Expanded gallery view"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg border border-[#D4AF37]/40 shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: INTERACTIVE RSVP SECTION
          Attending, meal preference, plus ones, message, and WhatsApp
          ───────────────────────────────────────────────────────────── */}
      {showRsvp && (
        <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#B8860B] font-semibold">
              Join Our Celebration
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
              RSVP
            </h2>
            {rsvpConfig.deadline && (
              <p className="text-xs font-sans text-stone-500 uppercase tracking-wider">
                Kindly respond by {formatDate(rsvpConfig.deadline)}
              </p>
            )}
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
          </div>

          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#D4AF37]/40 shadow-xl shadow-[#D4AF37]/10">
            {rsvpStatus === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-4"
              >
                <div className="w-16 h-16 bg-[#D4AF37]/20 text-[#B8860B] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif text-[#1A1A1A]">Shukran & Thank You!</h3>
                <p className="text-sm font-sans text-stone-600 max-w-md mx-auto leading-relaxed">
                  Your response has been received with warmth. We eagerly look forward to celebrating together.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleRsvpSubmitInternal} className="space-y-6">
                {/* Attending selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                    Will You Attend?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRsvpState({ ...rsvpState, attending: "yes" })}
                      className={`py-3 px-4 rounded-xl border text-xs font-sans font-semibold transition-all ${
                        rsvpState.attending === "yes"
                          ? "bg-[#D4AF37] text-white border-[#B8860B] shadow-md shadow-[#D4AF37]/20"
                          : "bg-[#FFFDF9] text-stone-700 border-stone-200 hover:border-[#D4AF37]"
                      }`}
                    >
                      Joyfully Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpState({ ...rsvpState, attending: "no" })}
                      className={`py-3 px-4 rounded-xl border text-xs font-sans font-semibold transition-all ${
                        rsvpState.attending === "no"
                          ? "bg-stone-800 text-white border-stone-900 shadow-md"
                          : "bg-[#FFFDF9] text-stone-700 border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      Regretfully Decline
                    </button>
                  </div>
                </div>

                {/* Guest Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="rsvp-guest-name" className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                      Your Full Name *
                    </label>
                    <input
                      id="rsvp-guest-name"
                      type="text"
                      required
                      value={rsvpState.guestName}
                      onChange={(e) => setRsvpState({ ...rsvpState, guestName: e.target.value })}
                      placeholder="e.g. Tariq Mansoor"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 font-sans text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rsvp-phone" className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                      Contact Phone
                    </label>
                    <input
                      id="rsvp-phone"
                      type="tel"
                      value={rsvpState.phone}
                      onChange={(e) => setRsvpState({ ...rsvpState, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 font-sans text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Plus Ones count */}
                {rsvpConfig.askPlusOnes && rsvpState.attending === "yes" && (
                  <div className="space-y-1">
                    <label htmlFor="rsvp-guests-count" className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                      Total Guests Attending
                    </label>
                    <select
                      id="rsvp-guests-count"
                      value={rsvpState.guestsCount}
                      onChange={(e) => setRsvpState({ ...rsvpState, guestsCount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 font-sans text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] bg-white"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Meal Preference */}
                {rsvpConfig.askMealPreference && rsvpState.attending === "yes" && (
                  <div className="space-y-1">
                    <label htmlFor="rsvp-meal" className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                      Meal Preference
                    </label>
                    <select
                      id="rsvp-meal"
                      value={rsvpState.mealPreference}
                      onChange={(e) => setRsvpState({ ...rsvpState, mealPreference: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 font-sans text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] bg-white"
                    >
                      <option value="Traditional Kerala Sadya">Traditional Kerala Sadya (Pure Veg)</option>
                      <option value="Thalassery Biryani (Halal Non-Veg)">Thalassery Biryani (Halal Non-Veg)</option>
                      <option value="Jain / Special Diet">Jain / Special Dietary</option>
                    </select>
                  </div>
                )}

                {/* Blessings Message */}
                <div className="space-y-1">
                  <label htmlFor="rsvp-message" className="block text-xs font-sans font-bold uppercase tracking-wider text-stone-700">
                    Warm Wishes & Blessings for the Couple
                  </label>
                  <textarea
                    id="rsvp-message"
                    rows={3}
                    value={rsvpState.message}
                    onChange={(e) => setRsvpState({ ...rsvpState, message: e.target.value })}
                    placeholder="Write a heartfelt blessing..."
                    className="w-full px-4 py-2.5 rounded-lg border border-stone-200 font-sans text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Submit button & WhatsApp alternative */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={rsvpStatus === "submitting"}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#996515] text-white font-sans font-semibold text-sm tracking-wide shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {rsvpStatus === "submitting" ? (
                      <span>Sending RSVP...</span>
                    ) : (
                      <>
                        <span>Confirm RSVP</span>
                        <Send className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-emerald-500/40 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-sans text-xs font-semibold transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      Send RSVP via WhatsApp directly
                    </a>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FOOTER: CREDITS & BLESSING
          ───────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 text-center border-t border-[#D4AF37]/30 text-stone-500 font-sans text-xs space-y-2 bg-[#FAF5EC]/50">
        <p className="font-serif text-sm text-[#1A1A1A]">
          {couple.brideName} & {couple.groomName}
        </p>
        <p className="tracking-wider uppercase text-[10px] text-[#B8860B]">
          With blessings & love from both families
        </p>
        <p className="text-[10px] text-stone-400 pt-2">
          Designed with Everafter Wedding Studio
        </p>
      </footer>
    </div>
  );
}
