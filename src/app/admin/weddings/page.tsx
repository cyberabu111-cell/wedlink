import React from "react";
import type { Metadata } from "next";
import { getAdminWeddings } from "@/app/actions/admin-weddings";
import AdminWeddingsManager from "@/components/admin/AdminWeddingsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Weddings & Free Bypass | Super Admin | Everafter",
  robots: { index: false, follow: false },
};

export default async function AdminWeddingsPage() {
  const overview = await getAdminWeddings();

  return <AdminWeddingsManager initialOverview={overview} />;
}
