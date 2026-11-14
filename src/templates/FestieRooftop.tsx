"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowDown,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Share2,
} from "lucide-react";
import type { VenueEvent, WeddingTemplateProps } from "@/types/wedding";
import {
  getGoogleCalendarUrl,
  getGoogleMapsDirectionUrl,
} from "@/components/shared/WeddingActionHelpers";

const assetPath = "/templates/festie-rooftop";
const DEFAULT_RED = "#ae111a";
const DEFAULT_GOLD = "#f5d992";
const IST_OFFSET = "+05:30";

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const ZERO_COUNTDOWN: CountdownParts = {
  days: "00",
  hours: "00",
  minutes: "00",
  seconds: "00",
};

function parseDateOnly(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDateOnly(value);
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

function formatTime(value: string): string {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function getCountdownParts(
  dateValue: string,
  now: number,
  timeValue = "",
): CountdownParts {
  const date = parseDateOnly(dateValue);
  if (!date) return ZERO_COUNTDOWN;

  const time = timeValue.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  const timePart = time ? `${time[1]}:${time[2]}` : "00:00";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const target = new Date(`${year}-${month}-${day}T${timePart}:00${IST_OFFSET}`).getTime();
  const remaining = Math.max(0, target - now);

  return {
    days: String(Math.floor(remaining / 86_400_000)).padStart(2, "0"),
    hours: String(Math.floor((remaining % 86_400_000) / 3_600_000)).padStart(2, "0"),
    minutes: String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0"),
    seconds: String(Math.floor((remaining % 60_000) / 1_000)).padStart(2, "0"),
  };
}

function formatTimeRange(event: VenueEvent): string {
  if (!event.startTime && !event.endTime) return "";
  if (event.startTime && event.endTime) {
    return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`;
  }
  return formatTime(event.startTime || event.endTime);
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--festie-red)] sm:text-[11px]">
      {children}
    </p>
  );
}

function CountdownUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1 py-2 text-center sm:px-3 sm:py-4">
      <p className="font-[Georgia,serif] text-[clamp(1.8rem,7vw,3.7rem)] leading-none text-white tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[8px] font-semibold tracking-[0.18em] text-[#f7dfad] sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function CeremonyCard({
  event,
  couple,
  onTrackEvent,
  animationDelay,
}: {
  event: VenueEvent;
  couple: { brideName: string; groomName: string };
  onTrackEvent?: WeddingTemplateProps["onTrackEvent"];
  animationDelay: number;
}) {
  const dateLabel = formatDate(event.date);
  const timeLabel = formatTimeRange(event);
  const calendarUrl = getGoogleCalendarUrl(event, couple);
  const directionsUrl = getGoogleMapsDirectionUrl(event);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: animationDelay }}
      className="relative overflow-hidden rounded-[1.6rem] border border-[#f5d992]/35 bg-[#51080d]/55 p-5 shadow-[0_18px_48px_rgba(35,0,0,0.22)] backdrop-blur-sm sm:p-7"
    >
      <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full border border-[#f5d992]/15" />
      <div className="pointer-events-none absolute -right-7 -top-9 size-28 rounded-full border border-[#f5d992]/10" />

      <div className="relative">
        <div className="text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#f5d992]">
            {event.eventName || "Wedding celebration"}
          </p>
          <h3 className="mt-2 font-[Georgia,serif] text-2xl leading-tight text-white sm:text-3xl">
            {dateLabel ? dateLabel.split(", ").slice(1).join(" ") : "A day to celebrate"}
          </h3>
          {dateLabel && (
            <p className="mt-1 text-xs text-white/65">{dateLabel.split(", ")[0]}</p>
          )}
        </div>

        <div className="mx-auto mt-5 max-w-sm space-y-3 border-y border-white/15 py-4 text-sm text-white/90">
          {timeLabel && (
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5d992] text-[#681017]">
                <Clock3 size={16} aria-hidden="true" />
              </span>
              <span>{timeLabel}</span>
            </div>
          )}
          {(event.venueName || event.venueAddress) && (
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5d992] text-[#681017]">
                <MapPin size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                {event.venueName && <span className="block font-semibold">{event.venueName}</span>}
                {event.venueAddress && (
                  <span className="block text-xs leading-relaxed text-white/65">{event.venueAddress}</span>
                )}
              </span>
            </div>
          )}
          {event.dressCode && (
            <p className="text-center text-xs text-white/70">Dress code: {event.dressCode}</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {calendarUrl && (
            <motion.a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrackEvent?.("calendar_click")}
              whileTap={{ scale: 0.97 }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#f5d992] px-4 py-2 text-[11px] font-bold text-[#451014] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CalendarDays size={14} aria-hidden="true" />
              Save to Calendar
            </motion.a>
          )}
          {directionsUrl && (
            <motion.a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onTrackEvent?.("map_click")}
              whileTap={{ scale: 0.97 }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/5 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MapPin size={14} aria-hidden="true" />
              Track Location
            </motion.a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function FestieRooftop({
  data,
  isPreview = false,
  onTrackEvent,
}: WeddingTemplateProps) {
  const [now, setNow] = useState<number | null>(null);
  const [activeCountdownEvent, setActiveCountdownEvent] = useState(0);
  const [blessingCount, setBlessingCount] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [onlySection, setOnlySection] = useState<string | null>(null);

  const couple = {
    brideName: data.couple.brideName?.trim() || "The Bride",
    groomName: data.couple.groomName?.trim() || "The Groom",
    weddingDate: data.couple.weddingDate || "",
    coverPhoto: data.couple.coverPhotoUrl || `${assetPath}/rooftop-couple.png`,
  };

  const events = useMemo(
    () =>
      (data.events || []).filter((event) =>
        Boolean(event.eventName || event.date || event.venueName || event.venueAddress),
      ),
    [data.events],
  );

  const selectedEvent = events[activeCountdownEvent] || events[0];
  const countdown = now === null
    ? ZERO_COUNTDOWN
    : getCountdownParts(couple.weddingDate, now);
  const eventCountdown = now === null
    ? ZERO_COUNTDOWN
    : getCountdownParts(
        selectedEvent?.date || couple.weddingDate,
        now,
        selectedEvent?.startTime || "",
      );
  const displayDays = data.countdown?.daysRemaining || countdown.days;

  const showCoverPhoto = data.sections?.showCoverPhoto !== false;
  const showCountdown = data.sections?.showCountdown !== false;
  const showEvents = data.sections?.showEvents !== false;
  const showStory = data.sections?.showStory !== false;
  const showGallery = data.sections?.showGallery !== false;
  const hasStory = Boolean(data.story?.title?.trim() || data.story?.content?.trim());
  const gallery = data.gallery || [];

  const groomName = data.groom?.name?.trim() || couple.groomName;
  const brideName = data.bride?.name?.trim() || couple.brideName;
  const primaryDate = events[0]?.date || couple.weddingDate;
  const heroDate = parseDateOnly(primaryDate);
  const heroMonthYear = heroDate
    ? heroDate.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" })
    : "Save the date";
  const heroWeekday = heroDate
    ? heroDate.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long" })
    : "Date coming soon";
  const heroTime = events[0]?.startTime ? formatTime(events[0].startTime) : "";
  const heroDateDetails = heroDate
    ? `${heroWeekday} · ${heroTime || "Time TBA"}`
    : heroWeekday;

  const blessingMessage = data.blessing?.message ??
    `${groomName} and ${brideName} begin a new chapter of love, faith, and lifelong companionship. May their union be blessed with barakah, mawaddah, and rahmah.`;
  const blessingVerse = data.blessing?.verse ??
    "And He has put love and mercy between your hearts.";
  const blessingReference = data.blessing?.verseReference ?? "Surah Ar-Rum [30:21]";
  const arabicDua = data.blessing?.arabicDua ??
    "بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ";
  const closingMessage = data.blessing?.closingMessage ??
    "May Allah bless you and shower His blessings upon you and unite you in love and goodness.";

  const primaryColor = data.theme?.primaryColor || DEFAULT_RED;
  const secondaryColor = data.theme?.secondaryColor || DEFAULT_GOLD;
  const fontFamily = data.theme?.fontFamily === "sans"
    ? "Arial, Helvetica, sans-serif"
    : data.theme?.fontFamily === "playfair"
      ? "'Playfair Display', Georgia, serif"
      : "Georgia, 'Times New Roman', serif";
  const themeStyle = {
    "--festie-red": primaryColor,
    "--festie-gold": secondaryColor,
    fontFamily,
  } as React.CSSProperties;

  const sectionInitial = { opacity: 0, y: 22 };
  const sectionReveal = { opacity: 1, y: 0 };

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setOnlySection(params.get("only"));
  }, []);

  useEffect(() => {
    if (!isPreview) return;
    const className = "festie-preview-no-scrollbar";
    document.documentElement.classList.add(className);
    return () => document.documentElement.classList.remove(className);
  }, [isPreview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get("section") || window.location.hash.replace("#", "");
    if (!target) return;
    const timer = window.setTimeout(() => {
      const element = document.getElementById(target === "closing" || target === "flower" ? "festie-closing" : target);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeCountdownEvent >= events.length) setActiveCountdownEvent(0);
  }, [activeCountdownEvent, events.length]);

  const shareOnWhatsApp = () => {
    const message = `Join us to celebrate ${groomName} and ${brideName}: ${window.location.href}`;
    const shareUrl = new URL("https://api.whatsapp.com/send");
    shareUrl.searchParams.set("text", message);
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const closingSectionJSX = (
    <section
      id="festie-closing"
      className="relative isolate overflow-visible bg-[var(--festie-red)] px-5 pb-10 text-center text-white sm:px-8 sm:pb-14"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/15 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 aspect-square w-[min(78vw,390px)] -translate-x-1/2 -translate-y-1/2">
        <motion.img
          initial={sectionInitial}
          whileInView={sectionReveal}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          src={`${assetPath}/red-hibiscus.png`}
          alt="Deep red hibiscus flower"
          className="size-full select-none object-contain drop-shadow-[0_18px_35px_rgba(35,0,0,0.28)]"
        />
      </div>
      <div className="mx-auto flex max-w-[560px] flex-col items-center pt-[calc(min(78vw,390px)/2+1.5rem)]">
        <motion.button
          type="button"
          onClick={() => setBlessingCount((count) => count + 1)}
          whileTap={{ scale: 0.96 }}
          className="relative z-10 inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white ring-1 ring-white/35 transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Send a blessing to the couple"
        >
          <Heart size={14} fill="currentColor" aria-hidden="true" />
          Bless the Couple
          {blessingCount > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">{blessingCount}</span>}
        </motion.button>

        <motion.div
          initial={sectionInitial}
          whileInView={sectionReveal}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="relative z-10 mt-6 flex flex-col items-center"
        >
          <h2 className="max-w-full break-words font-['Playfair_Display',Georgia,serif] text-[clamp(2.2rem,10vw,4.2rem)] font-semibold leading-[0.98] tracking-tight text-[#fff5e8] drop-shadow-md">
            {groomName}
          </h2>
          <p className="my-1 font-script text-3xl italic leading-none text-[#ffe5bf] sm:text-4xl">weds</p>
          <h2 className="max-w-full break-words font-['Playfair_Display',Georgia,serif] text-[clamp(2.2rem,10vw,4.2rem)] font-semibold leading-[0.98] tracking-tight text-[#fff5e8] drop-shadow-md">
            {brideName}
          </h2>
          {data.couple.hashtag && (
            <p className="mt-4 text-[11px] font-semibold tracking-[0.18em] text-white/75">
              {data.couple.hashtag}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={sectionInitial}
          whileInView={sectionReveal}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="mt-8 w-full"
        >
          <p dir="rtl" className="font-serif text-lg leading-loose text-[#fff1d2] sm:text-xl">
            {arabicDua}
          </p>
          <p className="mx-auto mt-3 max-w-[390px] text-xs leading-6 text-white/80 sm:text-sm">
            {closingMessage}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-8 flex w-full max-w-[350px] flex-col items-center gap-2.5"
        >
          <motion.button
            type="button"
            onClick={shareOnWhatsApp}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a1a1a] shadow-lg shadow-black/20 transition hover:bg-[#fff5e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Share2 size={16} aria-hidden="true" />
            Share invitation on WhatsApp
          </motion.button>
          <motion.button
            type="button"
            onClick={copyInviteLink}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/65 bg-transparent px-6 py-2.5 text-xs font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {copyState === "copied" ? (
              <>
                <Check size={15} className="text-[#c5ffc0]" aria-hidden="true" />
                <span className="text-[#c5ffc0]">Invite link copied</span>
              </>
            ) : (
              "Copy invite link"
            )}
          </motion.button>
          {copyState === "error" && (
            <p className="text-xs text-[#ffe0d2]" role="alert">
              Could not copy the link. Please copy the page address from your browser.
            </p>
          )}
        </motion.div>

        <div className="my-7 w-full max-w-[280px] border-t border-white/25" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="space-y-1.5 text-center"
        >
          <p className="text-[10px] tracking-wide text-white/70">
            With love and heartfelt prayers from both families
          </p>
          <p className="text-[11px] font-semibold text-[#ffe8b9]">Invited with love &amp; joy</p>
          <p className="pt-3 text-[9px] leading-relaxed text-white/55">
            Created with devotion for this occasion · Contact us on WhatsApp if needed
          </p>
        </motion.div>
      </div>
    </section>
  );

  if (onlySection === "closing" || onlySection === "flower" || onlySection === "festie-closing") {
    return (
      <MotionConfig reducedMotion="user">
        <main style={themeStyle} className="min-h-screen overflow-x-clip bg-[#fffaf5] pt-[min(39vw,195px)]">
          {closingSectionJSX}
        </main>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        style={themeStyle}
        className="overflow-x-clip bg-[#fffaf5] text-[#2d211e] antialiased"
      >
        {/* HERO */}
        <section
          id="festie-hero"
          className="relative isolate min-h-[min(850px,100svh)] overflow-hidden bg-[#26100d] text-white sm:min-h-[760px]"
        >
          {showCoverPhoto && (
            <motion.img
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              src={couple.coverPhoto}
              alt={`Illustration of ${groomName} and ${brideName} beneath a rooftop in the rain`}
              className="absolute inset-0 -z-20 size-full object-cover object-center"
            />
          )}
          {!showCoverPhoto && (
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_30%,#6a281b,#1f0c0a_75%)]" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#170805]/55 via-[#1b0908]/10 to-[#170706]/90" />
          <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-black/35 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="absolute inset-x-0 top-5 z-10 flex flex-col items-center px-5 text-center sm:top-7"
          >
            <img
              src={`${assetPath}/save-the-date.png`}
              alt="Save the Date"
              className="w-[min(43vw,205px)] drop-shadow-xl sm:w-[190px]"
            />
            <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.34em] text-white/75 sm:text-[9px]">
              Together with our families
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.08 }}
            className="absolute inset-x-0 top-[34%] z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center"
          >
            <h1 className="max-w-full break-words font-['Playfair_Display',Georgia,serif] text-[clamp(2.35rem,10.5vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[#fff3df] drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]">
              {groomName}
            </h1>
            <p className="my-1.5 -rotate-6 bg-[var(--festie-red)] px-4 py-1 font-script text-[clamp(1.35rem,5vw,2.1rem)] italic leading-none text-white shadow-lg">
              weds
            </p>
            <h2 className="max-w-full break-words font-['Playfair_Display',Georgia,serif] text-[clamp(2.35rem,10.5vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[#fff3df] drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]">
              {brideName}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
            className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#170706]/95 via-[#170706]/75 to-transparent px-5 pb-12 pt-28 text-center sm:pb-14 sm:pt-36"
          >
            <div className="mx-auto max-w-lg">
              <div className="mx-auto inline-flex items-center gap-3 rounded-md border border-[#f5d992]/40 bg-[#24100d]/80 px-4 py-2.5 text-left shadow-lg backdrop-blur-sm">
                <span className="min-w-9 text-center font-['Playfair_Display',Georgia,serif] text-3xl leading-none text-[#ffe6b7] tabular-nums">
                  {heroDate ? heroDate.getUTCDate() : "—"}
                </span>
                <span aria-hidden="true" className="h-9 w-px bg-[#f5d992]/45" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff3df] sm:text-[11px]">
                    {heroMonthYear}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#f5d992]">
                    {heroDateDetails}
                  </span>
                </span>
              </div>
              {(events[0]?.venueName || events[0]?.venueAddress) && (
                <div className="mt-4 text-xs leading-relaxed text-white/85 sm:text-sm">
                  {events[0]?.venueName && <p className="font-semibold">@ {events[0].venueName}</p>}
                  {events[0]?.venueAddress && <p className="mt-0.5 text-white/70">{events[0].venueAddress}</p>}
                </div>
              )}
              {data.couple.hashtag && (
                <p className="mt-3 text-[10px] tracking-[0.18em] text-[#f5d992]/90">
                  {data.couple.hashtag}
                </p>
              )}
            </div>
            <motion.a
              href="#festie-countdown"
              whileTap={{ scale: 0.98 }}
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 p-2 text-[8px] uppercase tracking-[0.22em] text-white/65 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-3"
            >
              <span>Scroll to explore</span>
              <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                <ArrowDown size={15} aria-hidden="true" />
              </motion.span>
            </motion.a>
          </motion.div>
        </section>

        {/* COUNTDOWN INTRO */}
        {showCountdown && (
          <section
            id="festie-countdown"
            className="relative isolate overflow-hidden bg-[#fffaf5] px-5 py-16 sm:px-8 sm:py-24"
          >
            <img
              src={`${assetPath}/floral-heart.png`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 top-2 -z-10 w-[min(72vw,470px)] rotate-[-7deg] opacity-25 sm:-right-20 sm:top-0"
            />
            <motion.div
              initial={sectionInitial}
              whileInView={sectionReveal}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="mx-auto max-w-5xl text-center"
            >
              <SectionEyebrow>A new chapter begins</SectionEyebrow>
              <p className="mt-3 font-[Georgia,serif] text-lg italic text-[#5a4840] sm:text-xl">
                A lifetime waits just ahead
              </p>
              <div className="mt-2 flex items-end justify-center gap-3 sm:gap-5">
                <span className="font-['Playfair_Display',Georgia,serif] text-[clamp(6.5rem,25vw,12rem)] font-semibold leading-[0.82] tracking-[-0.07em] text-[var(--festie-red)] tabular-nums">
                  {displayDays}
                </span>
                <span className="mb-2 max-w-20 text-left font-[Georgia,serif] text-xl italic leading-tight text-[#3f302b] sm:mb-4 sm:text-2xl">
                  days to go
                </span>
              </div>
              <div className="mx-auto mt-7 h-px w-20 bg-[var(--festie-gold)]" />
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78645a]">
                Counting the moments until forever
              </p>

              {events.length > 0 && (
                <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2">
                  {events.slice(0, 2).map((event, index) => {
                    const date = parseDateOnly(event.date);
                    return (
                      <motion.article
                        key={event.id}
                        initial={sectionInitial}
                        whileInView={sectionReveal}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55, delay: index * 0.08 }}
                        className="grid grid-cols-[4rem_minmax(0,1fr)] items-center border-y border-[#e5d3bd] bg-white/45 px-4 py-4 text-left"
                      >
                        <div className="flex flex-col items-center border-r border-[#e5d3bd] pr-3">
                          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#806c60]">
                            {date
                              ? date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short" })
                              : "TBD"}
                          </span>
                          <span className="font-['Playfair_Display',Georgia,serif] text-4xl leading-none text-[var(--festie-red)]">
                            {date ? date.getUTCDate() : "—"}
                          </span>
                          {date && (
                            <span className="mt-1 text-[8px] tracking-[0.12em] text-[#806c60]">
                              {date.getUTCFullYear()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 pl-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--festie-red)]">
                            {event.eventName || "Wedding ceremony"}
                          </p>
                          {!date && (
                            <p className="mt-1 text-[10px] italic text-[#806c60]">
                              Date to be announced
                            </p>
                          )}
                          <p className="mt-1 break-words font-[Georgia,serif] text-sm text-[#4f3e36]">
                            {event.venueName || "Venue to be announced"}
                          </p>
                          {event.startTime && (
                            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#806c60]">
                              {formatTime(event.startTime)}
                            </p>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* THE COUPLE */}
        <section
          id="festie-couple"
          className="relative isolate overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-24"
        >
          <img
            src={`${assetPath}/red-hibiscus.png`}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-1/2 -z-10 w-[min(52vw,350px)] -translate-y-1/2 rotate-[-18deg] opacity-[0.12]"
          />
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={sectionInitial}
              whileInView={sectionReveal}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="text-center"
            >
              <SectionEyebrow>Two hearts, one beautiful journey</SectionEyebrow>
              <h2 className="mt-3 font-['Playfair_Display',Georgia,serif] text-4xl leading-tight text-[#392722] sm:text-5xl">
                Meet the couple
              </h2>
              <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-[#78665c] sm:text-sm">
                With the blessings of our families, we invite you to share in our special day.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-7">
              {[
                {
                  title: "The Groom",
                  name: groomName,
                  person: data.groom,
                  bio: data.couple.groomBio,
                  relation: "S/O",
                  photo: data.couple.groomPhoto,
                },
                {
                  title: "The Bride",
                  name: brideName,
                  person: data.bride,
                  bio: data.couple.brideBio,
                  relation: "D/O",
                  photo: data.couple.bridePhoto,
                },
              ].map(({ title, name, person, bio, relation, photo }, index) => (
                <motion.article
                  key={title}
                  initial={sectionInitial}
                  whileInView={sectionReveal}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="relative overflow-hidden rounded-[1.6rem] border border-[#eadfd4] bg-[#fffaf5]/90 p-6 text-center shadow-[0_14px_40px_rgba(67,34,24,0.06)] sm:p-8"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full border border-[#e8d3bd]" />
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="mx-auto size-24 rounded-full border-4 border-white object-cover shadow-md sm:size-28"
                    />
                  ) : (
                    <div className="mx-auto grid size-24 place-items-center rounded-full border border-[#edd8c1] bg-[#faeee1] font-['Playfair_Display',Georgia,serif] text-3xl text-[var(--festie-red)] shadow-inner sm:size-28 sm:text-4xl">
                      {name.trim().charAt(0).toUpperCase() || "♥"}
                    </div>
                  )}
                  <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#89766b]">{title}</p>
                  <h3 className="mt-1 break-words font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,7vw,3.5rem)] leading-tight text-[var(--festie-red)]">
                    {name}
                  </h3>
                  {person?.qualification && (
                    <p className="mt-1 text-xs font-medium text-[#806d62]">{person.qualification}</p>
                  )}
                  {bio && <p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-[#64534b]">{bio}</p>}
                  {(person?.fatherName || person?.motherName) && (
                    <div className="mx-auto mt-5 max-w-xs border-t border-[#eadfd4] pt-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--festie-red)]">{relation}</p>
                      {person.fatherName && <p className="mt-1 text-xs text-[#473831]">{person.fatherName}</p>}
                      {person.motherName && <p className="mt-0.5 text-xs text-[#66544b]">{person.motherName}</p>}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* COUNTDOWN + CEREMONIES */}
        {showEvents && (
          <section
            id="festie-ceremonies"
            className="relative isolate overflow-hidden bg-[#790b12] px-5 py-16 text-white sm:px-8 sm:py-24"
          >
            <img
              src={`${assetPath}/red-carpet.png`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 size-full object-cover object-center opacity-60"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(71,3,8,0.94),rgba(151,13,23,0.88),rgba(82,4,10,0.94))]" />
            <div className="mx-auto max-w-5xl">
              <motion.div
                initial={sectionInitial}
                whileInView={sectionReveal}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.65 }}
                className="text-center"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#f5d992]">
                  The big day is almost here
                </p>
                <h2 className="mt-3 font-['Playfair_Display',Georgia,serif] text-4xl text-white sm:text-5xl">
                  The celebration
                </h2>
                <p className="mt-2 text-xs text-white/70 sm:text-sm">
                  Every moment is more special with you by our side.
                </p>
              </motion.div>

              {showCountdown && (
                <motion.div
                  initial={sectionInitial}
                  whileInView={sectionReveal}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.65, delay: 0.06 }}
                  className="mx-auto mt-9 max-w-3xl rounded-[1.6rem] border border-[#f5d992]/65 bg-[#47070d]/55 p-4 shadow-[0_20px_55px_rgba(22,0,0,0.25)] backdrop-blur-sm sm:mt-12 sm:p-7"
                >
                  {events.length > 1 && (
                    <div
                      className="mb-4 grid overflow-hidden rounded-full border border-white/20 bg-white/10 sm:mx-auto sm:max-w-xl"
                      style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))` }}
                      role="group"
                      aria-label="Choose a ceremony countdown"
                    >
                      {events.map((event, index) => (
                        <motion.button
                          key={event.id}
                          type="button"
                          aria-pressed={activeCountdownEvent === index}
                          onClick={() => setActiveCountdownEvent(index)}
                          whileTap={{ scale: 0.98 }}
                          className={`min-h-11 px-2 py-2 text-[10px] transition focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#f5d992] sm:text-xs ${
                            activeCountdownEvent === index
                              ? "bg-[#f5d992] font-bold text-[#4c0c11]"
                              : "text-white/85 hover:bg-white/10"
                          }`}
                        >
                          <span className="block truncate">{event.eventName || "Ceremony"}</span>
                          <span className="mt-0.5 block text-[9px] opacity-75">
                            {formatDate(event.date, { weekday: undefined, year: undefined, month: "short", day: "numeric" })}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {events.length === 1 && (
                    <p className="mb-3 text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[#f5d992]">
                      {events[0].eventName || "Wedding ceremony"}
                    </p>
                  )}
                  <div className="grid grid-cols-4 divide-x divide-white/25">
                    <CountdownUnit label="DAYS" value={eventCountdown.days} />
                    <CountdownUnit label="HOURS" value={eventCountdown.hours} />
                    <CountdownUnit label="MINUTES" value={eventCountdown.minutes} />
                    <CountdownUnit label="SECONDS" value={eventCountdown.seconds} />
                  </div>
                </motion.div>
              )}

              <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:mt-12 md:grid-cols-2">
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <CeremonyCard
                      key={event.id}
                      event={event}
                      couple={data.couple}
                      onTrackEvent={onTrackEvent}
                      animationDelay={index * 0.1}
                    />
                  ))
                ) : (
                  <motion.p
                    initial={sectionInitial}
                    whileInView={sectionReveal}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55 }}
                    className="mx-auto rounded-2xl border border-white/25 bg-[#51080d]/55 p-6 text-center text-sm text-white/80 md:col-span-2"
                  >
                    Celebration details will be shared soon.
                  </motion.p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* OPTIONAL STORY */}
        {showStory && hasStory && (
          <section id="festie-story" className="relative overflow-hidden bg-[#fffaf5] px-5 py-16 text-center sm:px-8 sm:py-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="mx-auto max-w-2xl"
            >
              <SectionEyebrow>Our journey</SectionEyebrow>
              <h2 className="mt-3 font-['Playfair_Display',Georgia,serif] text-3xl text-[#392722] sm:text-4xl">
                {data.story.title || "A story written together"}
              </h2>
              {data.story.content && (
                <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#64534b] sm:text-base sm:leading-8">
                  {data.story.content}
                </p>
              )}
              {data.story.milestones && data.story.milestones.length > 0 && (
                <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                  {data.story.milestones.map((milestone, index) => (
                    <motion.article
                      key={`${milestone.year}-${milestone.title}-${index}`}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.55, delay: index * 0.07 }}
                      className="rounded-xl border border-[#eadfd4] bg-white p-4"
                    >
                      <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--festie-red)]">{milestone.year}</p>
                      <h3 className="mt-1 font-serif text-lg text-[#392722]">{milestone.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#78665c]">{milestone.description}</p>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* OPTIONAL GALLERY */}
        {showGallery && gallery.length > 0 && (
          <section id="festie-gallery" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-5xl text-center">
              <motion.div
                initial={sectionInitial}
                whileInView={sectionReveal}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
              >
                <SectionEyebrow>Moments to remember</SectionEyebrow>
                <h2 className="mt-3 font-['Playfair_Display',Georgia,serif] text-3xl text-[#392722] sm:text-4xl">Our gallery</h2>
              </motion.div>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
                {gallery.map((image, index) => (
                  <motion.img
                    key={`${image}-${index}`}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.55, delay: (index % 3) * 0.07 }}
                    src={image}
                    alt={`Wedding gallery photograph ${index + 1}`}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* BLESSING */}
        <section
          id="festie-blessings"
          className="relative isolate overflow-hidden bg-[#fffaf5] px-5 pt-16 pb-48 text-center sm:px-8 sm:pt-24 sm:pb-56"
        >
          <img
            src={`${assetPath}/floral-heart.png`}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-32 -z-10 w-[min(48vw,340px)] rotate-[22deg] opacity-20"
          />
          <motion.div
            initial={sectionInitial}
            whileInView={sectionReveal}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-2xl"
          >
            <SectionEyebrow>A prayer for a lifetime</SectionEyebrow>
            <h2 className="mt-3 font-['Playfair_Display',Georgia,serif] text-3xl leading-tight text-[var(--festie-red)] sm:text-4xl">
              Written in the stars,<br /> blessed by Allah
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#4d3b34] sm:text-base sm:leading-8">
              {blessingMessage}
            </p>
            <blockquote className="mx-auto mt-8 max-w-md font-[Georgia,serif] text-lg italic leading-relaxed text-[#7a1a20] sm:text-xl">
              “{blessingVerse}”
              <cite className="mt-3 block font-sans text-[9px] font-semibold not-italic uppercase tracking-[0.2em] text-[#78665c]">
                — {blessingReference}
              </cite>
            </blockquote>
          </motion.div>
        </section>

        {closingSectionJSX}
      </main>
    </MotionConfig>
  );
}
