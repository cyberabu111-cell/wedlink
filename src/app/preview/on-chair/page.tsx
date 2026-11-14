"use client";

import React, { useState, useEffect } from "react";
import OnChair from "@/templates/OnChair";
import type { WeddingData } from "@/types/wedding";
import { Smartphone, Monitor, Sliders, Eye, ArrowLeft, Sparkles, Volume2, Film } from "lucide-react";
import Link from "next/link";

const initialMockData: WeddingData = {
  couple: {
    brideName: "Rabiyath",
    groomName: "Nusrath",
    brideBio: "Beloved daughter of a gracious family, stepping into a lifetime of love and companionship.",
    groomBio: "Supported by family and elders, embarking on this beautiful journey of faith and togetherness.",
    weddingDate: "2027-01-24",
    hashtag: "#RabiyathWedsNusrath",
    coverPhotoUrl: "/templates/on-chair/poster.jpg",
  },
  hero: {
    videoUrl: "/templates/on-chair/background.mp4",
    posterUrl: "/templates/on-chair/poster.jpg",
    daysToGo: "07",
  },
  story: {
    title: "Our Sacred Journey",
    content: "Destiny brought our paths together, and with the prayers and blessings of our beloved parents and family, we unite as one in holy matrimony.",
    milestones: [
      {
        year: "2025",
        title: "When Two Hearts Aligned",
        description: "An auspicious introduction blessed by our families, marking the beginning of our journey.",
      },
      {
        year: "2026",
        title: "The Sacred Promise",
        description: "With heartfelt Du'a from all our elders, the engagement was solemnized.",
      },
      {
        year: "24 Jan 2027",
        title: "The Nikah Celebration",
        description: "The blessed day we take our vows under the grace of the Almighty at CK Convention Center Chavakkad.",
      },
    ],
  },
  events: [
    {
      id: "nikah-ceremony",
      eventName: "Nikah Ceremony",
      date: "2026-10-22",
      startTime: "9:30 AM",
      endTime: "13:00",
      venueName: "CK Convention Center Chavakkad",
      venueAddress: "CK Convention Center, Bypass Road, Chavakkad, Kerala 680506",
      googleMapsUrl: "https://maps.google.com/?q=CK+Convention+Center+Chavakkad",
      dressCode: "Traditional Islamic / Elegant Festive",
      lat: 10.5898,
      lng: 76.0229,
    },
    {
      id: "wedding-ceremony",
      eventName: "Wedding Ceremony",
      date: "2026-10-22",
      startTime: "9:30 AM",
      endTime: "15:00",
      venueName: "CK Convention Center Chavakkad",
      venueAddress: "CK Convention Center, Bypass Road, Chavakkad, Kerala 680506",
      googleMapsUrl: "https://maps.google.com/?q=CK+Convention+Center+Chavakkad",
      dressCode: "Formal Evening",
      lat: 10.5898,
      lng: 76.0229,
    },
  ],
  gallery: [
    "/templates/on-chair/poster.jpg",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  ],
  theme: {
    primaryColor: "#061512",
    secondaryColor: "#d4f72c",
    fontFamily: "serif",
  },
  rsvpConfig: {
    enabled: true,
    askDietaryPreference: true,
    deadline: "2027-01-15",
    whatsappNumber: "+919876543210",
  },
  sections: {
    showCoverPhoto: true,
    showCouplePhotos: true,
    showCountdown: true,
    showStory: true,
    showGallery: true,
    showEvents: true,
    showRsvp: true,
    showMusic: true,
  },
};

export default function OnChairPreviewPage() {
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop" | "compare">("mobile");
  const [customData, setCustomData] = useState<WeddingData>(initialMockData);
  const [showConfig, setShowConfig] = useState(false);
  const [activeScreen, setActiveScreen] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const screenParam = params.get("screen");
      const hash = window.location.hash;
      if (screenParam === "6" || hash === "#screen-conclusion") {
        setActiveScreen(5);
      } else if (screenParam === "5" || hash === "#screen-blessings") {
        setActiveScreen(4);
      } else if (screenParam === "4" || hash === "#screen-ceremony-details") {
        setActiveScreen(3);
      } else if (screenParam === "3" || hash === "#screen-couple-details") {
        setActiveScreen(2);
      } else if (screenParam === "2" || hash === "#screen-countdown") {
        setActiveScreen(1);
      } else if (screenParam === "1" || hash === "#screen-hero") {
        setActiveScreen(0);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#030a08] text-white flex flex-col font-sans">
      {/* ── TOP PREVIEW TOOLBAR ── */}
      <nav className="h-16 px-4 bg-[#061512]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4f72c] animate-pulse" />
            <h1 className="font-serif text-sm sm:text-base font-semibold text-white tracking-wide">
              On Chair Template Preview
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/30 uppercase tracking-wider">
              Video Background
            </span>
          </div>
        </div>

        {/* Viewport & Options Toggle */}
        <div className="flex items-center gap-2">
          {/* Screen Jump Buttons */}
          <div className="bg-black/40 border border-white/10 p-1 rounded-xl hidden sm:flex items-center gap-1">
            {[
              { id: 0, label: "1: Hero" },
              { id: 1, label: "2: Countdown" },
              { id: 2, label: "3: Couple" },
              { id: 3, label: "4: Ceremony" },
              { id: 4, label: "5: Blessings" },
              { id: 5, label: "6: Closing" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScreen(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeScreen === s.id
                    ? "bg-[#d4f72c] text-[#061512] font-semibold shadow"
                    : "text-stone-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* View Modes */}
          <div className="bg-black/40 border border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                deviceView === "mobile"
                  ? "bg-[#d4f72c] text-[#061512] font-semibold shadow-md"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile Story</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                deviceView === "desktop"
                  ? "bg-[#d4f72c] text-[#061512] font-semibold shadow-md"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceView("compare")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                deviceView === "compare"
                  ? "bg-[#d4f72c] text-[#061512] font-semibold shadow-md"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mock Compare</span>
            </button>
          </div>

          {/* Edit Data Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 transition-all text-xs flex items-center gap-1.5"
            title="Edit Test Data"
          >
            <Sliders className="w-3.5 h-3.5 text-[#d4f72c]" />
            <span className="hidden md:inline">Test Data</span>
          </button>
        </div>
      </nav>

      {/* ── MAIN WORKSPACE AREA ── */}
      <main className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* VIEW 1: MOBILE PHONE CONTAINER (9:16) */}
        {deviceView === "mobile" && (
          <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden bg-[#030a08]">
            <div
              className="relative max-h-full max-w-full overflow-hidden bg-[#061512] shadow-2xl"
              style={{
                width: "min(100%, 420px, calc((100dvh - 4rem) * 9 / 16))",
                aspectRatio: "9 / 16",
              }}
            >
              <OnChair data={customData} isPreview={true} activeScreen={activeScreen} />
            </div>
          </div>
        )}

        {/* VIEW 2: EXPANDED FULLSCREEN CANVAS */}
        {deviceView === "desktop" && (
          <div className="flex-1 min-h-0 overflow-hidden bg-[#061512]">
            <OnChair data={customData} isPreview={true} activeScreen={activeScreen} />
          </div>
        )}

        {/* VIEW 3: SIDE-BY-SIDE DESIGN MOCK COMPARISON */}
        {deviceView === "compare" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
            {/* Left: Original Design Mock Provided by User */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
                  Original Design Reference (User Image)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Static Reference
                </span>
              </div>
              <div className="rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black max-w-md mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/templates/on-chair/design-mock.jpg"
                  alt="Original Design Reference"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Right: Real Interactive Video Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[#d4f72c] font-semibold">
                  Live Animated Template (On Chair)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#d4f72c]/20 text-[#d4f72c] font-mono flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  Live Video Background
                </span>
              </div>
              <div className="rounded-3xl overflow-hidden border border-[#d4f72c]/30 shadow-2xl bg-[#061512] max-w-md mx-auto h-[820px] overflow-y-auto relative ring-2 ring-[#d4f72c]/20">
                <OnChair data={customData} isPreview={true} />
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE-OVER TEST DATA CONFIG PANEL ── */}
        {showConfig && (
          <div className="w-80 md:w-96 bg-[#0c1e19] border-l border-white/15 p-6 overflow-y-auto z-30 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#d4f72c]" />
                  <h3 className="font-serif text-sm font-semibold text-white">Live Data Controls</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="text-stone-400 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              {/* Names */}
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-stone-300 block uppercase tracking-wider">
                  Couple Names
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400">Bride</span>
                    <input
                      type="text"
                      value={customData.couple.brideName}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          couple: { ...customData.couple, brideName: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400">Groom</span>
                    <input
                      type="text"
                      value={customData.couple.groomName}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          couple: { ...customData.couple, groomName: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Wedding Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-300 block uppercase tracking-wider">
                  Wedding Date
                </label>
                <input
                  type="date"
                  value={customData.couple.weddingDate}
                  onChange={(e) =>
                    setCustomData({
                      ...customData,
                      couple: { ...customData.couple, weddingDate: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                />
              </div>

              {/* Primary Venue */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-300 block uppercase tracking-wider">
                  Primary Venue Name
                </label>
                <input
                  type="text"
                  value={customData.events[0]?.venueName || ""}
                  onChange={(e) => {
                    const newEvents = [...customData.events];
                    if (newEvents[0]) newEvents[0].venueName = e.target.value;
                    setCustomData({ ...customData, events: newEvents });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                />
              </div>

              {/* Sections Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-[11px] font-medium text-stone-300 block uppercase tracking-wider">
                  Section Visibility
                </label>
                {(
                  [
                    ["showCountdown", "Countdown Timer"],
                    ["showEvents", "Ceremonies & Maps"],
                    ["showStory", "Love Story Milestones"],
                    ["showGallery", "Photo Gallery"],
                    ["showRsvp", "RSVP Form"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-xs text-stone-300 py-1 cursor-pointer">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={customData.sections?.[key] !== false}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          sections: {
                            ...customData.sections,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[#d4f72c]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCustomData(initialMockData)}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-stone-300 transition-all"
              >
                Reset to &quot;Rabiyath weds Nusrath&quot;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
