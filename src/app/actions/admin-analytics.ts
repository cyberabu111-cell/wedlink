"use server";

import { requireAdmin } from "@/lib/auth/adminGuard";
import { createAdminClient } from "@/lib/supabase/server";

export interface AnalyticsEventRecord {
  id: string;
  weddingId: string;
  eventType: "page_view" | "map_click" | "calendar_click" | "rsvp_submit";
  deviceType: string | null;
  referrer: string | null;
  createdAt: string;
}

export interface PlatformAnalyticsOverview {
  totalPageViews: number;
  totalMapClicks: number;
  totalCalendarClicks: number;
  totalRsvpSubmissions: number;
  totalWeddings: number;
  totalPaidWeddings: number;
  totalRsvps: number;
  recentEvents: AnalyticsEventRecord[];
}

export async function getPlatformAnalytics(): Promise<PlatformAnalyticsOverview> {
  await requireAdmin();
  const adminClient = await createAdminClient();

  let totalPageViews = 0;
  let totalMapClicks = 0;
  let totalCalendarClicks = 0;
  let totalRsvpSubmissions = 0;
  let recentEvents: AnalyticsEventRecord[] = [];

  // Query page_events table gracefully
  try {
    const { data: events, error } = await adminClient
      .from("page_events")
      .select("id, wedding_id, event_type, device_type, referrer, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && events) {
      events.forEach((evt: any) => {
        if (evt.event_type === "page_view") totalPageViews++;
        else if (evt.event_type === "map_click") totalMapClicks++;
        else if (evt.event_type === "calendar_click") totalCalendarClicks++;
        else if (evt.event_type === "rsvp_submit") totalRsvpSubmissions++;
      });

      recentEvents = events.slice(0, 20).map((evt: any) => ({
        id: evt.id,
        weddingId: evt.wedding_id,
        eventType: evt.event_type,
        deviceType: evt.device_type,
        referrer: evt.referrer,
        createdAt: evt.created_at,
      }));
    }
  } catch (err: any) {
    console.warn("[admin-analytics] Note querying page_events:", err?.message);
  }

  // Query weddings count and views
  let totalWeddings = 0;
  let totalPaidWeddings = 0;
  try {
    const { data: weddings } = await adminClient
      .from("weddings")
      .select("is_paid, views_count");

    if (weddings) {
      totalWeddings = weddings.length;
      totalPaidWeddings = weddings.filter((w: any) => w.is_paid).length;
      const aggregatedViews = weddings.reduce((sum: number, w: any) => sum + (Number(w.views_count) || 0), 0);
      if (aggregatedViews > totalPageViews) {
        totalPageViews = aggregatedViews;
      }
    }
  } catch (err: any) {
    console.warn("[admin-analytics] Note querying weddings count:", err?.message);
  }

  // Query total RSVPs count
  let totalRsvps = 0;
  try {
    const { count } = await adminClient.from("rsvps").select("*", { count: "exact", head: true });
    totalRsvps = count || 0;
  } catch {
    // Graceful fallback
  }

  return {
    totalPageViews,
    totalMapClicks,
    totalCalendarClicks,
    totalRsvpSubmissions,
    totalWeddings,
    totalPaidWeddings,
    totalRsvps,
    recentEvents,
  };
}
