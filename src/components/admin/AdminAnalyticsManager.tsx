"use client";

import React from "react";
import {
  BarChart3,
  Eye,
  Calendar,
  Compass,
  Send,
  Users,
  Heart,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import type { PlatformAnalyticsOverview } from "@/app/actions/admin-analytics";

interface Props {
  analytics: PlatformAnalyticsOverview;
}

export default function AdminAnalyticsManager({ analytics }: Props) {
  const conversionRate =
    analytics.totalPageViews > 0
      ? ((analytics.totalRsvpSubmissions / analytics.totalPageViews) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider">
            Realtime Analytics
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Platform Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Aggregated guest interaction metrics across all published invitations, including page views, directions clicks, calendar exports, and RSVP conversions.
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Page Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{analytics.totalPageViews}</p>
          <p className="text-[11px] text-slate-500">Total guest visits</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Map Directions</span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{analytics.totalMapClicks}</p>
          <p className="text-[11px] text-slate-500">Navigation clicks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Calendar Adds</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-indigo-600">{analytics.totalCalendarClicks}</p>
          <p className="text-[11px] text-slate-500">Google / Apple exports</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">RSVP Submissions</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{analytics.totalRsvpSubmissions}</p>
          <p className="text-[11px] text-slate-500">Conversion: {conversionRate}%</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{analytics.totalWeddings}</p>
            <p className="text-xs text-slate-500">Total User Invitations</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{analytics.totalPaidWeddings}</p>
            <p className="text-xs text-slate-500">Paid / Live Invitations</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{analytics.totalRsvps}</p>
            <p className="text-xs text-slate-500">Confirmed RSVP Guests</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Guest Activity Events</span>
          </h2>
          <span className="text-xs text-slate-400">Last 20 captured events</span>
        </div>

        {analytics.recentEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No guest interaction events recorded yet. View your published invitations to trigger live analytics events.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {analytics.recentEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] ${
                      evt.eventType === "page_view"
                        ? "bg-blue-100 text-blue-800"
                        : evt.eventType === "map_click"
                        ? "bg-amber-100 text-amber-800"
                        : evt.eventType === "calendar_click"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {evt.eventType.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    wedding: {evt.weddingId.slice(0, 8)}...
                  </span>
                </div>
                <div className="text-slate-400">
                  {new Date(evt.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
