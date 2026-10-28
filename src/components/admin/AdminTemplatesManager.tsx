"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ExternalLink,
  Code,
  Sparkles,
} from "lucide-react";
import type { TemplateDbRow } from "@/types/database";
import type { TEMPLATES } from "@/templates/registry";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateActive,
  syncLocalTemplatesToDatabase,
  type TemplateFormInput,
} from "@/app/actions/admin-templates";

interface Props {
  initialTemplates: TemplateDbRow[];
  localTemplates: typeof TEMPLATES;
  unsyncedLocalKeys: string[];
}

const CATEGORIES = ["Traditional", "Minimal", "Modern", "Floral", "Luxury"] as const;

export default function AdminTemplatesManager({
  initialTemplates,
  localTemplates,
  unsyncedLocalKeys: initialUnsynced,
}: Props) {
  const [templates, setTemplates] = useState<TemplateDbRow[]>(initialTemplates);
  const [unsyncedKeys, setUnsyncedKeys] = useState<string[]>(initialUnsynced);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDbRow | null>(null);
  const [formData, setFormData] = useState<TemplateFormInput>({
    id: "",
    name: "",
    description: "",
    category: "Luxury",
    price_inr: 1499,
    thumbnail_url: "",
    demo_slug: "",
    is_active: true,
  });
  const [formError, setFormError] = useState("");

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Set of local registered component keys
  const localKeySet = useMemo(() => new Set(localTemplates.map((t) => t.id)), [localTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleOpenAddModal = (prefillId?: string) => {
    const prefillLocal = localTemplates.find((t) => t.id === prefillId);
    setEditingTemplate(null);
    setFormData({
      id: prefillId || "",
      name: prefillLocal?.name || "",
      description: "",
      category: prefillLocal?.category || "Luxury",
      price_inr: 1499,
      thumbnail_url: prefillLocal?.thumbnailUrl || (prefillId ? `/thumbs/${prefillId}.webp` : ""),
      demo_slug: "",
      is_active: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (template: TemplateDbRow) => {
    setEditingTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      description: template.description || "",
      category: template.category,
      price_inr: template.price_inr,
      thumbnail_url: template.thumbnail_url,
      demo_slug: template.demo_slug || "",
      is_active: template.is_active,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    startTransition(async () => {
      if (editingTemplate) {
        const res = await updateTemplate(editingTemplate.id, formData);
        if (res.success) {
          setTemplates((prev) =>
            prev.map((t) => (t.id === editingTemplate.id ? { ...t, ...formData } : t))
          );
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to update template");
        }
      } else {
        const res = await createTemplate(formData);
        if (res.success) {
          const newRow: TemplateDbRow = {
            id: formData.id,
            name: formData.name,
            description: formData.description || null,
            category: formData.category,
            price_inr: formData.price_inr,
            thumbnail_url: formData.thumbnail_url,
            demo_slug: formData.demo_slug || null,
            is_active: formData.is_active ?? true,
            default_theme_config: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setTemplates((prev) => [newRow, ...prev]);
          setUnsyncedKeys((prev) => prev.filter((k) => k !== formData.id));
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to create template");
        }
      }
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_active: nextActive } : t))
    );

    startTransition(async () => {
      const res = await toggleTemplateActive(id, nextActive);
      if (!res.success) {
        // Rollback on error
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: currentActive } : t))
        );
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const idToDelete = deletingId;

    startTransition(async () => {
      const res = await deleteTemplate(idToDelete);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== idToDelete));
        if (localKeySet.has(idToDelete)) {
          setUnsyncedKeys((prev) => [...prev, idToDelete]);
        }
      }
      setDeletingId(null);
    });
  };

  const handleSyncAllLocal = async () => {
    startTransition(async () => {
      const res = await syncLocalTemplatesToDatabase();
      if (res.success) {
        // Refresh by updating local state
        const updatedDb = localTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          description: null,
          category: t.category,
          price_inr: 1499,
          thumbnail_url: t.thumbnailUrl,
          demo_slug: null,
          is_active: true,
          default_theme_config: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setTemplates(updatedDb);
        setUnsyncedKeys([]);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Template Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage dynamic wedding templates, pricing, and active catalog visibility.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unsyncedKeys.length > 0 && (
            <button
              onClick={handleSyncAllLocal}
              disabled={isPending}
              className="px-3.5 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>Sync All Local ({unsyncedKeys.length})</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Unsynced Warning Banner */}
      {unsyncedKeys.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">
                {unsyncedKeys.length} Local Template{unsyncedKeys.length > 1 ? "s" : ""} Detected in Registry
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Component files exist in <code className="bg-amber-100 px-1 py-0.5 rounded">src/templates/registry.ts</code> but are not yet saved to the database:{" "}
                <span className="font-mono font-medium">{unsyncedKeys.join(", ")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncAllLocal}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 text-xs whitespace-nowrap"
          >
            Sync to DB Now
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or slug ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const hasCodeComponent = localKeySet.has(template.id);

          return (
            <div
              key={template.id}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all ${
                template.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 shadow-sm border border-slate-200">
                      {template.category}
                    </span>
                    {!template.is_active && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                        Hidden
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-white shadow-sm">
                      ₹{template.price_inr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{template.name}</h3>
                    <code className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      id: {template.id}
                    </code>
                  </div>

                  {template.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {/* Component status in codebase */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center space-x-1.5">
                      <Code className="w-3.5 h-3.5 text-slate-400" />
                      <span>Code Component:</span>
                    </span>
                    {hasCodeComponent ? (
                      <span className="inline-flex items-center text-emerald-600 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-600 font-medium text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Not in registry
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(template.id, template.is_active)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors ${
                    template.is_active
                      ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      : "border-slate-300 text-slate-600 bg-white hover:bg-slate-100"
                  }`}
                >
                  {template.is_active ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(template)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(template.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingTemplate ? `Edit "${editingTemplate.name}"` : "Add Template to Database"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure template attributes, price, and active catalog listing.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Template ID / Slug */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Template ID (Registry Component Key) *
                </label>
                {editingTemplate ? (
                  <input
                    type="text"
                    disabled
                    value={formData.id}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. royal-kerala-gold"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    {/* Quick selection from registry */}
                    <div className="mt-1 flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[10px] text-slate-400">Or pick from local:</span>
                      {localTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              id: t.id,
                              name: formData.name || t.name,
                              category: t.category,
                              thumbnail_url: formData.thumbnail_url || t.thumbnailUrl,
                            })
                          }
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {t.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malabar Royal Gold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as TemplateFormInput["category"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price_inr}
                    onChange={(e) =>
                      setFormData({ ...formData, price_inr: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Thumbnail Image URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/thumbs/royal.webp or https://..."
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short tagline or aesthetic description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Demo Slug */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Demo Slug (Optional preview link)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul-and-priya"
                  value={formData.demo_slug}
                  onChange={(e) => setFormData({ ...formData, demo_slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-400"
                />
                <label htmlFor="modal-is-active" className="text-xs font-medium text-slate-700">
                  Active in user catalog (publicly selectable)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Delete Template?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <code className="font-mono font-bold text-slate-900">{deletingId}</code> from the database catalog? Any weddings currently assigned to this template will keep their template ID.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
