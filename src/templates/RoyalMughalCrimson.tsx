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
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  Send,
  Navigation,
} from "lucide-react";
import type { WeddingTemplateProps, VenueEvent } from "@/types/wedding";
import {
  getGoogleCalendarUrl,
  downloadIcsFile,
  getGoogleMapsDirectionUrl,
  EmbeddedMap,
} from "@/components/shared/WeddingActionHelpers";
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

export default function RoyalMughalCrimson({
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
    hashtag: rawData.couple?.hashtag || "#RoyalNikah",
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
      "Together with their families, cordially invite you to celebrate the joyous union of their hearts.",
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
          eventName: "Nikah Ceremony",
          title: "Nikah Ceremony",
          date: couple.weddingDate,
          startTime: "10:30",
          endTime: "13:00",
          dressCode: "Festive Traditional / Royal Crimson & Zari Gold",
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
          dressCode: "Royal Evening Glamour / Formal Elegance",
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
        venueName: venueObj.name || evt.venueName || "Grand Celebration Hall",
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
    setToastMessage(guestName.trim() ? `JazakAllah Khair, ${guestName}! Your heartfelt prayer has been recorded.` : "JazakAllah Khair! Your prayer and warm blessings have been received.");
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
    <div className="relative min-h-screen bg-[#FFFDF7] text-[#2A080C] font-serif antialiased selection:bg-[#D4AF37]/30 selection:text-[#8B0E23]">
      <style>{`
        .gold-shimmer {
          background: linear-gradient(135deg, #D4AF37 0%, #FFF3B0 50%, #B8860B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .royal-shadow {
          box-shadow: 0 10px 30px -5px rgba(107, 8, 24, 0.25), 0 0 15px rgba(212, 175, 55, 0.2);
        }
      `}</style>

      {/* ── 1. TAP TO OPEN SPLASH OVERLAY ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#29040A] p-4 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.22)_0%,transparent_75%)] pointer-events-none" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#6B0818] via-[#8B0E23] to-[#3F020C] border-2 border-[#D4AF37] rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#D4AF37] bg-[#3F020C] flex items-center justify-center shadow-inner">
                <span className="text-[#FFF3B0] text-2xl font-bold italic">
                  {getInitials(couple.groomName, couple.brideName)}
                </span>
              </div>
              <p className="text-[#D4AF37] text-xs uppercase tracking-widest font-sans font-semibold mb-2">
                Royal Mughal Wedding
              </p>
              <h2 className="text-3xl text-white font-serif font-bold mb-3 drop-shadow">
                {couple.groomName} <span className="text-[#D4AF37]">&</span> {couple.brideName}
              </h2>
              <p className="text-[#FCEEC7]/85 text-xs font-sans mb-6 leading-relaxed">
                We warmly invite you to witness and celebrate our sacred matrimonial celebration.
              </p>
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#B8860B] text-[#3E0208] font-sans text-xs font-bold uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>⚜️</span>
                <span>Open Royal Invitation</span>
                <span>⚜️</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. STICKY TOP NAVIGATION BAR ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#6B0818]/95 backdrop-blur-md border-b border-[#D4AF37]/50 shadow-md">
        <div className="w-full max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37] bg-[#8B0E23] flex items-center justify-center shadow-inner">
              <span className="text-[14px] text-[#FFF3B0] font-bold italic leading-none">
                {getInitials(couple.groomName, couple.brideName)}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-[11px] uppercase tracking-widest text-[#FCEEC7] font-semibold leading-tight">
                {couple.groomName} &amp; {couple.brideName}
              </span>
              <span className="font-sans text-[10px] tracking-wider text-[#E5C158] leading-tight">
                {formatDateUTC(couple.weddingDate, "short")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#events"
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#3E0208] font-sans text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-[#FFF3B0] shadow-sm hover:brightness-110 transition-all duration-200"
            >
              Save Date
            </a>
            {showMusic && hero.bgMusicUrl && (
              <button
                type="button"
                onClick={toggleAudio}
                className="w-8 h-8 rounded-full bg-[#8B0E23] border border-[#D4AF37]/60 flex items-center justify-center text-[#FCEEC7] hover:bg-[#A3122B] transition-colors"
                title={isPlaying ? "Mute Royal Music" : "Play Royal Music"}
                aria-label={isPlaying ? "Mute Royal Music" : "Play Royal Music"}
              >
                {isPlaying ? <Volume2 className="w-4 h-4 text-[#FFF3B0]" /> : <VolumeX className="w-4 h-4 text-[#FFF3B0]/60" />}
              </button>
            )}
            <a
              href="#blessings"
              className="w-8 h-8 rounded-full bg-[#8B0E23] border border-[#D4AF37]/60 flex items-center justify-center text-[#FCEEC7] hover:bg-[#A3122B] transition-colors"
              aria-label="Offer Blessings"
            >
              <Heart className="w-4 h-4 text-[#FDE68A] fill-[#FDE68A]" />
            </a>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN CONTENT CONTAINER ── */}
      <main className="w-full pt-16 bg-[#FFFDF7] min-h-screen">
        <div className="flex flex-col w-full">
          {/* Festive Toran & Garland Header Ribbon */}
          <div className="w-full bg-[#8B0E23] py-2 px-4 border-b border-[#D4AF37]/60">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] shadow-sm animate-pulse" />
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#FCEEC7] font-medium">
                  ✨ Royal Wedding Invitation • Kerala
                </span>
              </div>
              <span className="font-sans text-[10px] tracking-wider text-[#FDE68A] uppercase font-bold">
                {formatDateUTC(couple.weddingDate, "short")}
              </span>
            </div>
          </div>

          {/* Marigold & Mango Leaves Toran Arch Garland */}
          <div className="w-full relative bg-gradient-to-b from-[#6B0818] to-[#8B0E23] py-2.5 px-2 overflow-hidden border-b-2 border-[#D4AF37] shadow-inner">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="relative w-full flex justify-around items-center max-w-sm mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-[#D4AF37]" />
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-sm flex items-center justify-center border border-[#FFF3B0]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FEF08A] animate-ping" />
                </div>
                <span className="text-[10px] text-[#FEF08A]">🪔</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base text-[#F59E0B]">🏵️</span>
                <span className="text-xs text-[#D4AF37]">🍃</span>
                <span className="text-sm text-[#F59E0B]">🌼</span>
                <span className="text-xs text-[#D4AF37]">🍃</span>
                <span className="text-base text-[#EA580C]">🏵️</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-[#D4AF37]" />
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-sm flex items-center justify-center border border-[#FFF3B0]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FEF08A] animate-ping" />
                </div>
                <span className="text-[10px] text-[#FEF08A]">🪔</span>
              </div>
            </div>
          </div>

          {/* ── 4. HERO SECTION WITH ARCHIVAL PORTRAIT & BISMILLAH ── */}
          <section className="relative w-full pt-8 pb-10 px-4 flex flex-col items-center text-center overflow-hidden">
            {/* Arabic Bismillah Pill */}
            <div className="inline-flex flex-col items-center gap-1.5 px-6 py-2.5 bg-[#FAF4E6] border-2 border-[#D4AF37] rounded-full shadow-sm mb-6">
              <span className="text-[#8B0E23] text-xl md:text-2xl font-serif font-bold tracking-widest select-none">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#B8860B] font-semibold">
                In the Name of Allah, the Most Beneficent, the Most Merciful
              </span>
            </div>

            {/* Archival Portrait with Royal Mughal Zari & Marigold Border */}
            <div className="relative w-full max-w-sm aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#FFFDF7] to-[#FCEEC7] rounded-2xl p-2.5 mb-6 royal-shadow border-2 border-[#D4AF37]">
              {/* Ornate Gold Filigree Corners */}
              <div className="absolute inset-0 pointer-events-none z-10 p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <svg className="w-10 h-10 text-[#D4AF37] drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" viewBox="0 0 36 36">
                    <path d="M2 2 L16 2 M2 2 L2 16" />
                    <circle cx="10" cy="10" r="4" strokeWidth="1" />
                    <path d="M2 2 Q 14 6 14 14 Q 6 14 2 2" fill="currentColor" fillOpacity="0.15" />
                  </svg>
                  <svg className="w-10 h-10 text-[#D4AF37] drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" viewBox="0 0 36 36">
                    <path d="M34 2 L20 2 M34 2 L34 16" />
                    <circle cx="26" cy="10" r="4" strokeWidth="1" />
                    <path d="M34 2 Q 22 6 22 14 Q 30 14 34 2" fill="currentColor" fillOpacity="0.15" />
                  </svg>
                </div>
                <div className="flex justify-between items-end">
                  <svg className="w-10 h-10 text-[#D4AF37] drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" viewBox="0 0 36 36">
                    <path d="M2 34 L16 34 M2 34 L2 20" />
                    <circle cx="10" cy="26" r="4" strokeWidth="1" />
                    <path d="M2 34 Q 14 30 14 22 Q 6 22 2 34" fill="currentColor" fillOpacity="0.15" />
                  </svg>
                  <svg className="w-10 h-10 text-[#D4AF37] drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" viewBox="0 0 36 36">
                    <path d="M34 34 L20 34 M34 34 L34 20" />
                    <circle cx="26" cy="26" r="4" strokeWidth="1" />
                    <path d="M34 34 Q 22 30 22 22 Q 30 22 34 34" fill="currentColor" fillOpacity="0.15" />
                  </svg>
                </div>
              </div>

              {/* Photo */}
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={couple.coverPhotoUrl || couple.bridePhoto || couple.groomPhoto}
                  alt={`${couple.groomName} & ${couple.brideName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#29040A]/85 via-transparent to-transparent pointer-events-none" />

                {/* Bottom Caption Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white text-left z-20">
                  <div>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#FDE68A] flex items-center gap-1 font-bold">
                      <span>⚜️</span> Ceremonial Portrait
                    </span>
                    <span className="font-serif text-[20px] italic leading-tight text-white font-medium drop-shadow">
                      {couple.groomName} &amp; {couple.brideName}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#8B0E23]/90 border border-[#D4AF37] flex items-center justify-center text-[10px] text-[#FFF3B0] font-sans font-bold shadow-md">
                    {getInitials(couple.groomName, couple.brideName)}
                  </div>
                </div>
              </div>
            </div>

            {/* Couple Names & Tagline */}
            <div className="max-w-md mx-auto mb-6">
              <span className="font-sans text-[11px] uppercase tracking-widest text-[#8B0E23] font-bold block mb-1">
                The Royal Wedding Invitation
              </span>
              <h1 className="text-3xl md:text-4xl text-[#6B0818] font-serif font-bold tracking-tight mb-2">
                {couple.groomName} <span className="text-[#D4AF37] font-normal">&amp;</span> {couple.brideName}
              </h1>
              <p className="font-sans text-xs text-[#6A5243] max-w-sm mx-auto leading-relaxed">
                {hero.tagline}
              </p>
            </div>

            {/* ── 5. COUNTDOWN TIMER IN MUGHAL ARCH MOTIF FRAME ── */}
            {showCountdown && (
              <div className="w-full max-w-sm bg-gradient-to-b from-[#6B0818] to-[#8B0E23] p-4 mb-5 border-2 border-[#D4AF37] rounded-xl shadow-lg relative overflow-hidden text-center text-white">
                <div className="flex items-center justify-between mb-3 border-b border-[#D4AF37]/30 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#FDE68A]">⏳</span>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#FCEEC7] font-bold">
                      Auspicious Countdown
                    </span>
                  </div>
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#FDE68A] font-semibold">
                    {formatDateUTC(couple.weddingDate, "short")}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#3F020C]/90 p-2.5 rounded-lg border border-[#D4AF37]/60 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#FFF3B0] leading-none mb-1">
                      {timeLeft.days}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-[#FCEEC7]/70">
                      Days
                    </span>
                  </div>
                  <div className="bg-[#3F020C]/90 p-2.5 rounded-lg border border-[#D4AF37]/60 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#FFF3B0] leading-none mb-1">
                      {timeLeft.hours}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-[#FCEEC7]/70">
                      Hours
                    </span>
                  </div>
                  <div className="bg-[#3F020C]/90 p-2.5 rounded-lg border border-[#D4AF37]/60 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#FFF3B0] leading-none mb-1">
                      {timeLeft.minutes}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-[#FCEEC7]/70">
                      Mins
                    </span>
                  </div>
                  <div className="bg-[#3F020C]/90 p-2.5 rounded-lg border border-[#D4AF37]/60 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-[#FDE68A] leading-none mb-1 animate-pulse">
                      {timeLeft.seconds}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-[#FCEEC7]/70">
                      Secs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── 6. LINEAGE & FAMILY SECTION ── */}
          <section className="w-full bg-[#FAF4E6] py-9 px-4 border-y-2 border-[#D4AF37]/40">
            <div className="max-w-sm mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🦚</span>
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                    Genealogy &amp; Lineage
                  </span>
                  <span className="text-sm">🦚</span>
                </div>
                <h2 className="text-2xl text-[#6B0818] font-serif font-bold mt-1">
                  Honouring the Families
                </h2>
                <div className="w-16 h-0.5 bg-[#D4AF37] my-2" />
                <p className="font-sans text-xs text-[#6A5243]">
                  Joined in shared faith, dignity, and cherished family heritage.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Groom Card */}
                <div className="bg-[#FFFDF7] p-5 border-2 border-[#D4AF37] rounded-xl shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                      Groom &amp; Household
                    </span>
                    <span className="text-sm">⚜️</span>
                  </div>
                  <h3 className="text-xl text-[#6B0818] font-serif font-bold mb-1">
                    {couple.groomName}
                  </h3>
                  <p className="font-sans text-xs text-[#4A3305] leading-relaxed">
                    {couple.groomBio || "Warmly supported by respected family, elders, and kin in joyful gratitude to the Almighty."}
                  </p>
                </div>

                {/* Bride Card */}
                <div className="bg-[#FFFDF7] p-5 border-2 border-[#D4AF37] rounded-xl shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                      Bride &amp; Household
                    </span>
                    <span className="text-sm">⚜️</span>
                  </div>
                  <h3 className="text-xl text-[#6B0818] font-serif font-bold mb-1">
                    {couple.brideName}
                  </h3>
                  <p className="font-sans text-xs text-[#4A3305] leading-relaxed">
                    {couple.brideBio || "Cherished daughter of a noble house, embraced with prayers, love, and sacred blessings."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 7. STORY / MILESTONES SECTION ── */}
          {showStory && storyItems.length > 0 && (
            <section className="w-full bg-[#FFFDF7] py-9 px-4">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block mb-1">
                  Our Sacred Journey
                </span>
                <h2 className="text-2xl text-[#6B0818] font-serif font-bold mb-6">
                  Moments That Brought Us Together
                </h2>

                <div className="space-y-4 text-left">
                  {storyItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 bg-[#FAF4E6] border border-[#D4AF37] rounded-xl shadow-sm">
                      {item.year && (
                        <span className="font-sans text-[10px] uppercase tracking-wider text-[#B8860B] font-bold block mb-1">
                          {item.year}
                        </span>
                      )}
                      <h4 className="text-lg text-[#6B0818] font-serif font-bold mb-1">
                        {item.title}
                      </h4>
                      <p className="font-sans text-xs text-[#4A3305] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 8. CEREMONIES & PASSES SECTION ── */}
          {showEvents && (
            <section className="w-full py-9 px-4 bg-[#FAF4E6] border-y-2 border-[#D4AF37]/50" id="events">
              <div className="max-w-sm mx-auto">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🪔</span>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                      Ceremonial Itinerary
                    </span>
                    <span className="text-sm">🪔</span>
                  </div>
                  <h2 className="text-2xl text-[#6B0818] font-serif font-bold mt-1">
                    Schedule of Ceremonies
                  </h2>
                  <div className="w-16 h-0.5 bg-[#D4AF37] my-2" />
                  <p className="font-sans text-xs text-[#6A5243]">
                    Kindly present this digital pass upon arrival at the celebratory venues.
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
                        className="bg-[#FFFDF7] border-2 border-[#D4AF37] rounded-xl shadow-md overflow-hidden"
                      >
                        {/* Header Banner */}
                        <div className="bg-[#6B0818] px-4 py-2.5 flex items-center justify-between border-b border-[#D4AF37]">
                          <span className="font-sans text-[10px] uppercase tracking-widest text-[#FDE68A] font-bold">
                            Ceremonial Pass • 0{idx + 1}
                          </span>
                          <span className="font-sans text-[9px] uppercase tracking-widest bg-[#8B0E23] text-[#FFF3B0] px-2 py-0.5 rounded border border-[#D4AF37]/40">
                            Invited Guest
                          </span>
                        </div>

                        {/* Pass Content */}
                        <div className="p-5 flex flex-col gap-3">
                          <h3 className="text-xl text-[#6B0818] font-serif font-bold">
                            {evt.title}
                          </h3>

                          {/* Date & Time */}
                          <div className="flex items-center gap-3 text-xs text-[#4A3305]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#8B0E23]" />
                              <span className="font-semibold">{formatDateUTC(evt.date, "short")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#8B0E23]" />
                              <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                            </div>
                          </div>

                          {/* Venue Details */}
                          <div className="p-3 bg-[#FAF4E6] rounded-lg border border-[#D4AF37]/40 flex flex-col gap-1">
                            <div className="flex items-start gap-1.5 text-xs text-[#6B0818] font-bold">
                              <MapPin className="w-3.5 h-3.5 text-[#8B0E23] shrink-0 mt-0.5" />
                              <span>{evt.venueName}</span>
                            </div>
                            <p className="text-[11px] text-[#6A5243] font-sans pl-5 leading-normal">
                              {evt.venueAddress}
                            </p>
                          </div>

                          {evt.dressCode && (
                            <div className="text-[11px] font-sans text-[#8C6A03] bg-[#FCEEC7]/50 px-3 py-1 rounded border border-[#D4AF37]/30">
                              <strong className="font-semibold">Dress Code:</strong> {evt.dressCode}
                            </div>
                          )}

                          {/* Cut-along dashed line */}
                          <div className="border-t border-dashed border-[#D4AF37]/70 my-1 relative">
                            <span className="absolute -top-2.5 left-2 bg-[#FFFDF7] px-1 text-[9px] text-[#B8860B] font-mono">
                              ✂ PRESENT AT GATE
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

          {/* ── 9. DEDICATED VENUE MAPS & ROUTE SECTION ── */}
          <section className="w-full bg-[#FFFDF7] py-9 px-4">
            <div className="max-w-sm mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📍</span>
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                    Ceremony Locations
                  </span>
                  <span className="text-sm">📍</span>
                </div>
                <h2 className="text-2xl text-[#6B0818] font-serif font-bold mt-1">
                  Venue &amp; Route Direction
                </h2>
                <div className="w-16 h-0.5 bg-[#D4AF37] my-2" />
                <p className="font-sans text-xs text-[#6A5243]">
                  Interactive directions and travel transit assistance for visiting guests.
                </p>
              </div>

              {/* Transit Hubs */}
              <div className="bg-[#FFFDF7] p-4 border-2 border-[#D4AF37] rounded-xl shadow-sm mb-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs">✈️</span>
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block">
                    Transit Hub Proximity
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="flex items-center gap-2 p-2.5 bg-[#FAF4E6] border border-[#D4AF37]/40 rounded-lg">
                    <Plane className="w-4 h-4 text-[#8B0E23] shrink-0" />
                    <div>
                      <span className="font-sans text-[11px] font-bold text-[#6B0818] block leading-tight">
                        Calicut (CCJ)
                      </span>
                      <span className="font-sans text-[9px] text-[#6A5243]">~24 km (35 min)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[#FAF4E6] border border-[#D4AF37]/40 rounded-lg">
                    <Train className="w-4 h-4 text-[#8B0E23] shrink-0" />
                    <div>
                      <span className="font-sans text-[11px] font-bold text-[#6B0818] block leading-tight">
                        Tirur Stn (TIR)
                      </span>
                      <span className="font-sans text-[9px] text-[#6A5243]">~12 km (18 min)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 10. PHOTO GALLERY SECTION ── */}
          {showGallery && gallery.length > 0 && (
            <section className="w-full bg-[#FAF4E6] py-9 px-4 border-y-2 border-[#D4AF37]/50">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block mb-1">
                  Cherished Memories
                </span>
                <h2 className="text-2xl text-[#6B0818] font-serif font-bold mb-6">
                  Photo Gallery
                </h2>

                <div className="grid grid-cols-2 gap-2.5">
                  {gallery.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImg(imgUrl)}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#D4AF37] cursor-pointer shadow-sm group hover:scale-[1.02] transition-transform"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:brightness-105 transition-all"
                      />
                      <div className="absolute inset-0 bg-[#29040A]/0 group-hover:bg-[#29040A]/20 transition-all flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 11. QURAN VERSE & INTERACTIVE BLESSINGS SECTION ── */}
          <section className="w-full px-4 py-9 bg-[#FFFDF7]" id="blessings">
            <div className="max-w-sm mx-auto flex flex-col gap-6">
              {/* Quran Surah Ar-Rum Card */}
              <div className="bg-gradient-to-b from-[#FFFDF7] to-[#FAF4E6] p-5 border-2 border-[#D4AF37] rounded-xl royal-shadow relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">📖</span>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold">
                      Surah Ar-Rum • 30:21
                    </span>
                  </div>
                  <span className="text-xs text-[#D4AF37]">⚜️</span>
                </div>
                <div className="text-center my-3">
                  <p className="text-[#8B0E23] text-lg font-serif leading-relaxed mb-2 font-medium">
                    وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
                  </p>
                  <p className="font-sans text-[11px] text-[#4A3305] italic leading-normal">
                    “And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy.”
                  </p>
                </div>
              </div>

              {/* Interactive Blessings Card */}
              <div className="bg-[#FFFDF7] p-5 border-2 border-[#D4AF37] rounded-xl royal-shadow text-left">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block">
                    Guest Felicitations
                  </span>
                  <span className="text-base">💐</span>
                </div>
                <h3 className="text-2xl text-[#6B0818] font-serif font-bold mt-1 mb-1">
                  Offer Your Blessings
                </h3>
                <p className="font-sans text-xs text-[#4A3305] mb-4 leading-normal">
                  Send your warm prayers and felicitations for the couple’s sacred bond.
                </p>

                <form onSubmit={handleSendBlessing} className="flex flex-col gap-3">
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B0818] font-bold block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Uncle Farooq &amp; Family"
                      className="w-full px-3 py-2 text-xs bg-[#FAF4E6] border border-[#D4AF37] rounded-lg text-[#2A080C] focus:outline-none focus:ring-1 focus:ring-[#8B0E23]"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B0818] font-bold block mb-1">
                      Heartfelt Prayer &amp; Dua
                    </label>
                    <textarea
                      rows={3}
                      value={guestDua}
                      onChange={(e) => setGuestDua(e.target.value)}
                      placeholder="May Allah shower infinite barakah, peace, and eternal joy upon your union..."
                      className="w-full px-3 py-2 text-xs bg-[#FAF4E6] border border-[#D4AF37] rounded-lg text-[#2A080C] focus:outline-none focus:ring-1 focus:ring-[#8B0E23]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#8B0E23] to-[#6B0818] text-[#FFF3B0] border border-[#D4AF37] rounded-lg font-sans text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#FDE68A] fill-[#FDE68A]" />
                    <span>Send Warm Blessing &amp; Dua</span>
                  </button>
                </form>

                {/* Blessing Count Indicator */}
                <div className="mt-4 pt-3 border-t border-[#D4AF37]/40 flex items-center justify-between text-xs text-[#8B0E23]">
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
                    className="mt-3 p-2.5 bg-[#FAF4E6] border border-[#D4AF37] rounded-lg text-xs text-[#6B0818] font-sans flex items-center gap-2"
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
            <section className="w-full py-9 px-4 bg-[#FAF4E6] border-y-2 border-[#D4AF37]/50" id="rsvp">
              <div className="max-w-sm mx-auto text-center">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block mb-1">
                  Respond with Joy
                </span>
                <h2 className="text-2xl text-[#6B0818] font-serif font-bold mb-2">
                  RSVP &amp; Attendance
                </h2>
                {rsvpConfig.deadline && (
                  <p className="font-sans text-xs text-[#B8860B] uppercase tracking-wider mb-4">
                    Kindly respond by {formatDateUTC(rsvpConfig.deadline, "short")}
                  </p>
                )}

                <div className="mt-4 flex flex-col items-center gap-2">
                  {rsvpConfig.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${rsvpConfig.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Salaam! I would love to RSVP for ${couple.brideName} & ${couple.groomName}'s royal wedding celebration.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrackEvent?.("rsvp_submit")}
                      className="w-full py-3 px-6 rounded-xl text-[#3E0208] text-xs font-sans font-bold tracking-wider uppercase bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#B8860B] hover:brightness-110 shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-[#FFF3B0]"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>RSVP via WhatsApp</span>
                    </a>
                  ) : isPreview ? (
                    <p className="text-xs text-[#8B0E23] font-sans">
                      Add your WhatsApp number in the <strong>RSVP &amp; URL</strong> tab to enable guest responses.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          {/* ── 13. ATTIRE PALETTE SECTION ── */}
          <section className="w-full bg-[#FAF4E6] py-8 px-4 border-t-2 border-[#D4AF37]/40">
            <div className="max-w-sm mx-auto text-center">
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B0E23] font-bold block mb-1">
                Festive Royal Attire
              </span>
              <p className="font-sans text-xs text-[#4A3305] mb-4">
                Celebratory ethnic or modest traditional occasion wear in rich royal crimson, cream ivory, or zari gold is warmly encouraged.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#8B0E23] border-2 border-[#D4AF37] shadow-sm" />
                  <span className="font-sans text-[9px] text-[#6B0818] font-semibold">Royal Crimson</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] border-2 border-[#FFF3B0] shadow-sm" />
                  <span className="font-sans text-[9px] text-[#6B0818] font-semibold">Zari Gold</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#FAF4E6] border-2 border-[#D4AF37] shadow-sm" />
                  <span className="font-sans text-[9px] text-[#6B0818] font-semibold">Ivory Silk</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#2A080C] border-2 border-[#D4AF37] shadow-sm" />
                  <span className="font-sans text-[9px] text-[#6B0818] font-semibold">Charcoal Velvet</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 14. SUNNAH SUPPLICATION & HASHTAG CLOSING SECTION ── */}
          <section className="w-full bg-gradient-to-b from-[#FFFDF7] to-[#FAF4E6] py-9 px-4 text-center border-t-2 border-[#D4AF37]">
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2 text-[#D4AF37]">
                <span className="text-base">⚜️</span>
                <span className="w-8 h-0.5 bg-[#D4AF37]" />
                <span className="text-lg">🪔</span>
                <span className="w-8 h-0.5 bg-[#D4AF37]" />
                <span className="text-base">⚜️</span>
              </div>
              <span className="font-sans text-[9px] uppercase tracking-widest text-[#B8860B] font-bold block mb-2">
                Sunnah Matrimonial Supplication
              </span>
              <p className="text-xl md:text-2xl text-[#8B0E23] font-serif font-bold leading-relaxed mb-2">
                بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
              </p>
              <p className="font-sans text-[11px] text-[#4A3305] italic mb-4 max-w-xs mx-auto">
                “May Allah bless you and shower His blessings upon you and unite you both in goodness.”
              </p>
              {couple.hashtag && (
                <div className="inline-block px-4 py-1.5 bg-[#8B0E23] text-[#FFF3B0] border border-[#D4AF37] rounded-full font-sans text-xs uppercase tracking-widest font-bold shadow-sm">
                  {couple.hashtag}
                </div>
              )}
            </div>
          </section>

          {/* ── 15. ROYAL FOOTER ── */}
          <footer className="w-full bg-[#3F020C] text-[#FFF3B0] border-t-2 border-[#D4AF37]">
            <div className="w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center text-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg italic text-[#FDE68A] font-serif">
                  {couple.groomName} &amp; {couple.brideName}
                </span>
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#E5C158]">
                  Royal Celebration &amp; Infinite Gratitude
                </span>
              </div>
              <p className="font-sans text-[10px] text-[#FCEEC7]/70">
                Crafted with love, prayers, and heartfelt joy from both families.
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
