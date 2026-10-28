import React from "react";
import type { Metadata } from "next";
import { getPlatformAnalytics } from "@/app/actions/admin-analytics";
import AdminAnalyticsManager from "@/components/admin/AdminAnalyticsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform Analytics | Super Admin | Everafter",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const analytics = await getPlatformAnalytics();

  return <AdminAnalyticsManager analytics={analytics} />;
}
