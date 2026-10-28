"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles,
  Share2,
  Compass,
  Send,
  CheckCircle2,
  ExternalLink,
  Maximize2,
  X,
  Heart,
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

export default function MinimalWhiteArch({
  data,
  isPreview = false,
  onRsvpSubmit,
  onTrackEvent,
}: WeddingTemplateProps) {
  const rawData = data as any;

  /* ── 0. Section Visibility Flags ── */
  const sections = (rawData.sections as any) || {};
  const showCountdown = sections.showCountdown !== false;
  const showStory = sections.showStory !== false;
  const showGallery = sections.showGallery !== false;
  const showEvents = sections.showEvents !== false;
  const showRsvp = sections.showRsvp !== false && Boolean(rawData.rsvpConfig?.enabled !== false);
  const showMusic = sections.showMusic !== false;

  /* ── 1. Normalize Props safely ── */
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
    hashtag: rawData.couple?.hashtag || "#ForeverUs",
    weddingDate: rawData.couple?.weddingDate || "2026-12-14",
  };

  const hero = {
    coverPhoto:
      rawData.hero?.coverPhoto ||
      rawData.couple?.coverPhotoUrl ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    tagline:
      rawData.hero?.tagline ||
      "Request the honour of your presence at the celebration of their marriage.",
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
          year: "The Beginning",
          title: rawData.story.title || "Our Story",
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
        title: evt.title || evt.eventName || `Celebration ${idx + 1}`,
        date: typeof evt.date === "string" ? evt.date : couple.weddingDate,
        startTime: evt.startTime || "11:00",
        endTime: evt.endTime || "15:00",
        dressCode: evt.dressCode || "",
        venueName: venueObj.name || evt.venueName || "Villa Bellisima",
        venueAddress: venueObj.address || evt.venueAddress || "Lake Como, Italy",
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
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
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

  /* ── 2. Interactive State ── */
  const [isOpen, setIsOpen] = useState(isPreview);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!couple.weddingDate) return;
    const updateCountdown = () => {
      const target = new Date(`${couple.weddingDate}T10:00:00+05:30`).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [couple.weddingDate]);

  /* ── Audio controls with browser unlock ── */
  const handleOpenInvitation = () => {
    setIsOpen(true);
    onTrackEvent?.("page_view");
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

  /* ── 3. RSVP state ── */
  const [rsvpState, setRsvpState] = useState({
    guestName: "",
    phone: "",
    attending: "yes",
    guestsCount: 1,
    mealPreference: "Chef's Tasting Menu",
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
        await new Promise((res) => setTimeout(res, 800));
      }
      onTrackEvent?.("rsvp_submit");
      setRsvpStatus("success");
    } catch {
      setRsvpStatus("error");
    }
  };

  const whatsappUrl = useMemo(() => {
    if (!rsvpConfig.whatsappNumber) return "";
    const clean = rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello! I am RSVPing for ${couple.brideName} & ${couple.groomName}'s wedding.\nName: ${
        rsvpState.guestName || "Guest"
      }\nStatus: ${rsvpState.attending === "yes" ? "Attending" : "Regretfully Declining"}\nGuests: ${
        rsvpState.guestsCount
      }`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  }, [rsvpConfig.whatsappNumber, couple.brideName, couple.groomName, rsvpState]);

  return (
    <div className="relative min-h-screen bg-[#FBFBF9] text-[#18181B] font-serif antialiased selection:bg-[#C5A880]/20 selection:text-[#8C7355]">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: ENVELOPE / SPLASH SCREEN OVERLAY
          Architectural linen paper with champagne gold foil ring
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/95 p-4 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.12)_0%,transparent_75%)] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative max-w-sm sm:max-w-md w-full bg-[#FFFFFF] rounded-[28px] p-8 sm:p-12 shadow-2xl border border-[#C5A880]/30 text-[#18181B] overflow-hidden"
            >
              {/* Architectural Top Arch Frame */}
              <div className="w-16 h-8 mx-auto border-t-2 border-l-2 border-r-2 border-[#C5A880] rounded-t-full mb-6 opacity-60" />

              <div className="space-y-6">
                <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#8C7355] font-semibold">
                  A Wedding Invitation
                </span>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-tight font-serif text-[#18181B]">
                    {couple.brideName}
                    <span className="block text-xl sm:text-2xl text-[#C5A880] italic my-1 font-serif">&</span>
                    {couple.groomName}
                  </h1>
                </div>

                <p className="text-xs font-sans text-stone-500 max-w-xs mx-auto leading-relaxed">
                  Invite you to celebrate love, friendship, and new beginnings.
                </p>

                {/* Minimal Foil Wax Seal Button */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenInvitation}
                    className="group relative inline-flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-[#C5A880] to-[#E5D4B8] text-white shadow-xl shadow-[#C5A880]/20 border-2 border-white cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full border border-white/50 flex flex-col items-center justify-center p-2 text-center">
                      <Sparkles className="w-4 h-4 text-white/90 mb-0.5 animate-pulse" />
                      <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-white">
                        Enter
                      </span>
                    </div>
                  </motion.button>
                  <p className="text-[10px] font-sans text-stone-400 mt-3 tracking-widest uppercase">
                    Tap to open invitation
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          FLOATING AUDIO MUTE/UNMUTE BUTTON
          ───────────────────────────────────────────────────────────── */}
      {showMusic && hero.bgMusicUrl && (
        <aside aria-label="Audio controls">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#18181B] text-white shadow-lg flex items-center justify-center border border-[#C5A880]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
            title={isPlaying ? "Mute Music" : "Play Music"}
            aria-label={isPlaying ? "Mute Music" : "Play Music"}
          >
            {isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-[#C5A880]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C5A880] rounded-full animate-ping" />
              </div>
            ) : (
              <VolumeX className="w-4 h-4 text-white/60" />
            )}
          </motion.button>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: HERO ARCH & LIVE COUNTDOWN
          Neoclassical Roman arch silhouette with champagne accents
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 sm:px-6 py-24 overflow-hidden border-b border-[#C5A880]/20 bg-gradient-to-b from-[#FFFFFF] via-[#FBFBF9] to-[#FFFFFF]">
        <div className="relative max-w-4xl mx-auto text-center space-y-10 z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-3"
          >
            <p className="text-[11px] font-sans uppercase tracking-[0.35em] text-[#8C7355] font-semibold">
              The Wedding Celebration of
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#18181B] font-serif leading-none">
              <span>{couple.brideName}</span>
              <span className="inline-block text-[#C5A880] italic mx-3 sm:mx-6 font-serif text-3xl sm:text-5xl">&</span>
              <span>{couple.groomName}</span>
            </h1>
            {couple.hashtag && (
              <p className="text-xs font-sans tracking-widest text-stone-400 uppercase font-medium">
                {couple.hashtag}
              </p>
            )}
          </motion.div>

          {/* Architectural Arch Frame */}
          {hero.coverPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mx-auto max-w-xs sm:max-w-sm"
            >
              <div className="relative p-2.5 rounded-t-[160px] rounded-b-[24px] bg-[#FFFFFF] shadow-2xl border border-[#C5A880]/40">
                <div className="overflow-hidden rounded-t-[150px] rounded-b-[16px] aspect-[3/4] bg-stone-100">
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

          {/* Date & Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-xl sm:text-2xl font-serif text-[#18181B] font-medium tracking-wide">
              {formatDate(couple.weddingDate)}
            </p>
            <p className="text-xs sm:text-sm font-sans text-stone-500 max-w-md mx-auto leading-relaxed">
              {hero.tagline}
            </p>
          </motion.div>

          {/* Live Minimal Countdown */}
          {showCountdown && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="inline-grid grid-cols-4 gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white border border-[#C5A880]/30 shadow-sm">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Mins", value: timeLeft.minutes },
                  { label: "Secs", value: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[55px] sm:min-w-[70px]">
                    <span className="text-2xl sm:text-3xl font-serif font-light text-[#18181B]">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-sans tracking-widest text-[#8C7355] uppercase font-semibold mt-1">
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
          SECTION 3: COUPLE & STORY TIMELINE
          ───────────────────────────────────────────────────────────── */}
      {(couple.brideBio || couple.groomBio || (showStory && storyItems.length > 0)) && (
        <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-b border-[#C5A880]/20">
          <div className="text-center space-y-2 mb-16">
            <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#8C7355] font-semibold">
              The Couple
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#18181B]">
              Bride & Groom
            </h2>
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
          </div>

          {/* Portrait Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-20">
            {/* Bride */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-[#C5A880]/20 shadow-sm">
              <div className="w-32 h-44 rounded-t-full rounded-b-xl overflow-hidden border border-[#C5A880]/40 shadow-sm mb-6">
                <img src={couple.bridePhoto} alt={couple.brideName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <h3 className="text-2xl font-serif text-[#18181B]">{couple.brideName}</h3>
              <p className="text-[10px] font-sans uppercase tracking-widest text-[#8C7355] mt-1 mb-3 font-semibold">
                The Bride
              </p>
              {couple.brideBio && (
                <p className="text-xs font-sans text-stone-500 leading-relaxed max-w-xs">
                  {couple.brideBio}
                </p>
              )}
            </div>

            {/* Groom */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-[#C5A880]/20 shadow-sm">
              <div className="w-32 h-44 rounded-t-full rounded-b-xl overflow-hidden border border-[#C5A880]/40 shadow-sm mb-6">
                <img src={couple.groomPhoto} alt={couple.groomName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <h3 className="text-2xl font-serif text-[#18181B]">{couple.groomName}</h3>
              <p className="text-[10px] font-sans uppercase tracking-widest text-[#8C7355] mt-1 mb-3 font-semibold">
                The Groom
              </p>
              {couple.groomBio && (
                <p className="text-xs font-sans text-stone-500 leading-relaxed max-w-xs">
                  {couple.groomBio}
                </p>
              )}
            </div>
          </div>

          {/* Story Milestones */}
          {showStory && storyItems.length > 0 && (
            <div className="space-y-10 max-w-2xl mx-auto">
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-serif text-[#18181B]">Moments in Time</h3>
                <p className="text-[11px] font-sans tracking-widest text-stone-400 uppercase">
                  How our story unfolded
                </p>
              </div>

              <div className="space-y-8">
                {storyItems.map((item) => (
                  <div key={item.id} className="relative pl-8 border-l border-[#C5A880]/40 py-2">
                    <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
                    {item.year && (
                      <span className="text-[11px] font-sans font-bold text-[#8C7355] tracking-widest uppercase">
                        {item.year}
                      </span>
                    )}
                    <h4 className="text-lg font-serif text-[#18181B] mt-0.5 mb-1.5">{item.title}</h4>
                    <p className="text-xs font-sans text-stone-500 leading-relaxed">{item.description}</p>
                    {item.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden max-w-sm border border-stone-200">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" loading="lazy" />
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
          SECTION 4: EVENTS & VENUE CARDS (ANALYTICS HOOKS ATTACHED)
          ───────────────────────────────────────────────────────────── */}
      {showEvents && events.length > 0 && (
        <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-b border-[#C5A880]/20">
        <div className="text-center space-y-2 mb-16">
          <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#8C7355] font-semibold">
            Itinerary
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#18181B]">
            Celebration Events
          </h2>
          <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((evt) => {
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
                className="flex flex-col justify-between rounded-2xl bg-white border border-[#C5A880]/30 shadow-sm p-6 sm:p-8 space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-serif text-[#18181B]">{evt.title}</h3>
                      <p className="text-xs font-sans font-semibold text-[#8C7355] uppercase tracking-wider mt-0.5">
                        {formatDate(evt.date)}
                      </p>
                    </div>
                    {evt.dressCode && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-medium bg-[#FBFBF9] text-[#8C7355] border border-[#C5A880]/30 whitespace-nowrap">
                        {evt.dressCode}
                      </span>
                    )}
                  </div>

                  {/* Timing & Venue */}
                  <div className="space-y-2 text-xs font-sans text-stone-600 border-t border-b border-stone-100 py-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                      <span>
                        {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-stone-800">{evt.venueName}</p>
                        <p className="text-stone-400 leading-relaxed text-[11px]">{evt.venueAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Map Preview */}
                  <div className="rounded-xl overflow-hidden border border-stone-200">
                    <EmbeddedMap
                      lat={evt.lat}
                      lng={evt.lng}
                      venueName={evt.venueName}
                      venueAddress={evt.venueAddress}
                      googlePlaceId={evt.googlePlaceId}
                      className="w-full h-40 rounded-xl border-0"
                    />
                  </div>
                </div>

                {/* Calendar & Map Navigation Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {googleCalUrl ? (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrackEvent?.("calendar_click")}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-sans font-medium bg-[#FBFBF9] text-[#8C7355] border border-[#C5A880]/40 hover:bg-[#C5A880]/10 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Add to calendar (Google)
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onTrackEvent?.("calendar_click");
                          downloadIcsFile(venueEventShape, couple);
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-sans font-medium bg-[#FBFBF9] text-[#8C7355] border border-[#C5A880]/40 hover:bg-[#C5A880]/10 transition-colors"
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
                      onClick={() => onTrackEvent?.("map_click")}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-sans font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition-colors shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5 mr-2 text-[#C5A880]" />
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
          ───────────────────────────────────────────────────────────── */}
      {showGallery && gallery.length > 0 && (
        <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-b border-[#C5A880]/20">
          <div className="text-center space-y-2 mb-16">
            <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#8C7355] font-semibold">
              Portraits
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#18181B]">
              Photo Gallery
            </h2>
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((url, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxImg(url)}
                className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
              >
                <img
                  src={url}
                  alt={`Memory ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lightbox */}
          <AnimatePresence>
            {lightboxImg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxImg(null)}
                className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center cursor-zoom-out"
              >
                <button onClick={() => setLightboxImg(null)} className="absolute top-6 right-6 text-white/80 p-2">
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={lightboxImg}
                  alt="Expanded gallery portrait"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/20 shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: RSVP FORM
          ───────────────────────────────────────────────────────────── */}
      {showRsvp && (
        <section className="py-24 px-4 sm:px-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#8C7355] font-semibold">
              Attendance
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#18181B]">
              RSVP
            </h2>
            {rsvpConfig.deadline && (
              <p className="text-xs font-sans text-stone-500 uppercase tracking-wider">
                Please respond before {formatDate(rsvpConfig.deadline)}
              </p>
            )}
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
          </div>

          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#C5A880]/30 shadow-sm">
            {rsvpStatus === "success" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-3">
                <div className="w-14 h-14 bg-[#C5A880]/20 text-[#8C7355] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif text-[#18181B]">Thank You</h3>
                <p className="text-xs font-sans text-stone-500 max-w-xs mx-auto leading-relaxed">
                  Your RSVP response has been confirmed. We look forward to celebrating together.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleRsvpSubmitInternal} className="space-y-5">
                {/* Attending Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-semibold text-stone-700">
                    Will You Attend?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRsvpState({ ...rsvpState, attending: "yes" })}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-sans font-semibold transition-all ${
                        rsvpState.attending === "yes"
                          ? "bg-[#18181B] text-white border-[#18181B] shadow-sm"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      Joyfully Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpState({ ...rsvpState, attending: "no" })}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-sans font-semibold transition-all ${
                        rsvpState.attending === "no"
                          ? "bg-stone-600 text-white border-stone-600 shadow-sm"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      Decline with Regret
                    </button>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="arch-guest-name" className="block text-xs font-sans font-semibold text-stone-700">
                      Your Full Name *
                    </label>
                    <input
                      id="arch-guest-name"
                      type="text"
                      required
                      value={rsvpState.guestName}
                      onChange={(e) => setRsvpState({ ...rsvpState, guestName: e.target.value })}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 font-sans text-xs focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="arch-phone" className="block text-xs font-sans font-semibold text-stone-700">
                      Phone Number
                    </label>
                    <input
                      id="arch-phone"
                      type="tel"
                      value={rsvpState.phone}
                      onChange={(e) => setRsvpState({ ...rsvpState, phone: e.target.value })}
                      placeholder="+1 555 123 4567"
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 font-sans text-xs focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                {/* Plus Ones */}
                {rsvpConfig.askPlusOnes && rsvpState.attending === "yes" && (
                  <div className="space-y-1">
                    <label htmlFor="arch-guests-count" className="block text-xs font-sans font-semibold text-stone-700">
                      Guests Attending
                    </label>
                    <select
                      id="arch-guests-count"
                      value={rsvpState.guestsCount}
                      onChange={(e) => setRsvpState({ ...rsvpState, guestsCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 font-sans text-xs focus:outline-none focus:border-[#C5A880] bg-white"
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
                    <label htmlFor="arch-meal" className="block text-xs font-sans font-semibold text-stone-700">
                      Meal Preference
                    </label>
                    <select
                      id="arch-meal"
                      value={rsvpState.mealPreference}
                      onChange={(e) => setRsvpState({ ...rsvpState, mealPreference: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 font-sans text-xs focus:outline-none focus:border-[#C5A880] bg-white"
                    >
                      <option value="Chef's Tasting Menu">Chef's Tasting Menu</option>
                      <option value="Vegan / Vegetarian Gourmet">Vegan / Vegetarian Gourmet</option>
                      <option value="Gluten-Free / Special Diet">Gluten-Free / Special Dietary</option>
                    </select>
                  </div>
                )}

                {/* Personal Message */}
                <div className="space-y-1">
                  <label htmlFor="arch-message" className="block text-xs font-sans font-semibold text-stone-700">
                    A Note for the Couple
                  </label>
                  <textarea
                    id="arch-message"
                    rows={3}
                    value={rsvpState.message}
                    onChange={(e) => setRsvpState({ ...rsvpState, message: e.target.value })}
                    placeholder="Share your warmest wishes..."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-200 font-sans text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                {/* Submit button */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={rsvpStatus === "submitting"}
                    className="w-full py-3 px-6 rounded-xl bg-[#18181B] text-white font-sans font-semibold text-xs tracking-wider uppercase shadow-sm hover:bg-[#27272A] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {rsvpStatus === "submitting" ? (
                      <span>Sending RSVP...</span>
                    ) : (
                      <>
                        <span>Submit Response</span>
                        <Send className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center py-2 px-4 rounded-xl border border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100 font-sans text-xs font-semibold transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                      RSVP via WhatsApp
                    </a>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 text-center border-t border-[#C5A880]/20 text-stone-400 font-sans text-xs space-y-1">
        <p className="font-serif text-sm text-[#18181B]">
          {couple.brideName} & {couple.groomName}
        </p>
        <p className="text-[10px] tracking-widest uppercase">
          Forever & Always
        </p>
      </footer>
    </div>
  );
}
