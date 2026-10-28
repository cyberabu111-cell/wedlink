import React from "react";
import type { Metadata } from "next";
import { getAdminTemplates } from "@/app/actions/admin-templates";
import AdminTemplatesManager from "@/components/admin/AdminTemplatesManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Template Manager | Super Admin | Everafter",
  robots: { index: false, follow: false },
};

export default async function AdminTemplatesPage() {
  const { dbTemplates, localTemplates, unsyncedLocalKeys } = await getAdminTemplates();

  return (
    <AdminTemplatesManager
      initialTemplates={dbTemplates}
      localTemplates={localTemplates}
      unsyncedLocalKeys={unsyncedLocalKeys}
    />
  );
}
