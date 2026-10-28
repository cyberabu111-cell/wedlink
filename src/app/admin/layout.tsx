import React from "react";
import Link from "next/link";
import { LayoutDashboard, Palette, HeartHandshake, BarChart3, ArrowLeft, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/adminGuard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Super Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/admin/templates" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                  EVERAFTER
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                  Super Admin
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              <Link
                href="/admin/templates"
                className="px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
              >
                <Palette className="w-4 h-4 text-slate-500" />
                <span>Templates</span>
              </Link>
              <Link
                href="/admin/weddings"
                className="px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
              >
                <HeartHandshake className="w-4 h-4 text-slate-500" />
                <span>Weddings & Free Bypass</span>
              </Link>
              <Link
                href="/admin/analytics"
                className="px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
              >
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Platform Analytics</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
              Logged in as <strong className="text-slate-800">{admin.email}</strong>
            </span>
            <Link
              href="/studio"
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
