"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Eye,
  Calendar,
  User,
  Trash2,
  RefreshCw,
  Edit,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  adminTogglePublishWedding,
  adminDeleteWedding,
  type AdminWeddingItem,
  type AdminWeddingsOverview,
} from "@/app/actions/admin-weddings";

interface Props {
  initialOverview: AdminWeddingsOverview;
}

export default function AdminWeddingsManager({ initialOverview }: Props) {
  const [weddings, setWeddings] = useState<AdminWeddingItem[]>(initialOverview.weddings);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft" | "bypass">("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Derived metrics
  const totalCount = weddings.length;
  const liveCount = weddings.filter((w) => w.isPaid).length;
  const bypassCount = weddings.filter((w) => w.publishedByAdmin).length;
  const totalViews = weddings.reduce((sum, w) => sum + w.viewsCount, 0);

  // Filtered weddings
  const filteredWeddings = useMemo(() => {
    return weddings.filter((w) => {
      const matchQuery =
        !searchQuery.trim() ||
        `${w.brideName} ${w.groomName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.templateId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (statusFilter === "live") return w.isPaid;
      if (statusFilter === "draft") return !w.isPaid;
      if (statusFilter === "bypass") return w.publishedByAdmin;
      return true;
    });
  }, [weddings, searchQuery, statusFilter]);

  const handleCopyUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/${slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleTogglePublish = (wedding: AdminWeddingItem) => {
    const nextState = !wedding.isPaid;
    const confirmText = nextState
      ? `Publish "${wedding.brideName} & ${wedding.groomName}" for FREE without requiring Cashfree payment?`
      : `Unpublish "${wedding.brideName} & ${wedding.groomName}"? Public guests will no longer be able to open the link.`;

    if (!confirm(confirmText)) return;

    startTransition(async () => {
      setActionMessage(null);
      const res = await adminTogglePublishWedding(wedding.id, nextState);
      if (res.success) {
        setWeddings((prev) =>
          prev.map((item) =>
            item.id === wedding.id
              ? { ...item, isPaid: nextState, publishedByAdmin: nextState }
              : item
          )
        );
        setActionMessage(
          nextState
            ? `Successfully published "${wedding.slug}" with Free Admin Bypass!`
            : `Unpublished "${wedding.slug}".`
        );
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  const handleDelete = (wedding: AdminWeddingItem) => {
    if (!confirm(`Are you sure you want to permanently delete the wedding "${wedding.slug}"?`)) return;

    startTransition(async () => {
      const res = await adminDeleteWedding(wedding.id);
      if (res.success) {
        setWeddings((prev) => prev.filter((item) => item.id !== wedding.id));
        setActionMessage(`Permanently deleted invitation "${wedding.slug}".`);
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(res.error || "Failed to delete wedding");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Mission */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Payment Bypass Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Weddings & Free Bypass
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            View all invitations created by couples. Bypass Cashfree payment to publish any wedding URL for free with a single click.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/studio/new"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm space-x-1.5"
          >
            <span>+ Create New Invitation</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invitations</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-500">Across all registered user accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live / Published</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{liveCount}</p>
          <p className="text-[11px] text-slate-500">Publicly accessible invitations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Admin Bypass</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{bypassCount}</p>
          <p className="text-[11px] text-slate-500">Published without Cashfree payment</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalViews}</p>
          <p className="text-[11px] text-slate-500">Recorded invitation visits</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by couple, slug, or user email..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Invitations ({totalCount})</option>
            <option value="live">Live Only ({liveCount})</option>
            <option value="draft">Draft Only ({totalCount - liveCount})</option>
            <option value="bypass">Free Bypass ({bypassCount})</option>
          </select>
        </div>
      </div>

      {/* Invitations Table / List */}
      {filteredWeddings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No invitations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No invitations matched "${searchQuery}". Try a different keyword.`
              : "No wedding invitations have been created yet on this deployment."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Couple & Date</th>
                  <th className="px-6 py-4">Public URL</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">Template</th>
                  <th className="px-6 py-4">Views</th>
                  <th className="px-6 py-4">Publish Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWeddings.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Couple & Date */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {w.brideName} & {w.groomName}
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{w.weddingDate || "Date TBD"}</span>
                      </div>
                    </td>

                    {/* Public URL Slug */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono">
                          /{w.slug}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(w.slug)}
                          title="Copy public link"
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          {copiedSlug === w.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Creator Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{w.userEmail}</span>
                      </div>
                    </td>

                    {/* Template ID */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {w.templateId.replace(/-/g, " ")}
                      </span>
                    </td>

                    {/* Views Count */}
                    <td className="px-6 py-4 font-medium text-slate-700 text-xs">
                      {w.viewsCount}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {w.isPaid ? (
                        w.publishedByAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Zap className="w-3 h-3 mr-1 text-amber-600" />
                            Free Bypass
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            Paid Live
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Draft / Unpaid
                        </span>
                      )}
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Free Bypass Toggle Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleTogglePublish(w)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5 ${
                            w.isPaid
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20"
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{w.isPaid ? "Unpublish" : "Free Publish"}</span>
                        </button>

                        {/* Open Public Live Link */}
                        <Link
                          href={`/${w.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open invitation in new tab"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Edit in Studio */}
                        <Link
                          href={`/studio/${w.id}`}
                          title="Open in Studio Editor"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(w)}
                          title="Delete invitation"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
