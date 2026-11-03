'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import type { WeddingData, VenueEvent } from '@/types/wedding';
import { TEMPLATES, getTemplateComponent } from '@/templates/registry';
import { saveWeddingDraft } from '@/app/actions/wedding';
import { signOut } from '@/app/actions/auth';
import Link from 'next/link';
import VenueLocationPicker from '@/components/editor/VenueLocationPicker';
import { updateVenueText } from '@/utils/maps';
import { getEventTimeRange } from '@/utils/calendar';
import PublishPayButton from '@/components/editor/PublishPayButton';
import ImageUploadDropzone from '@/components/editor/ImageUploadDropzone';
import MultiImageGalleryDropzone from '@/components/editor/MultiImageGalleryDropzone';

interface StudioEditorClientProps {
  initialData: WeddingData;
  initialTemplateId: string;
  initialSlug: string;
  weddingId: string;
  isPaid: boolean;
  returnedFromPayment?: boolean;
  userEmail?: string | null;
}

type TabKey = 'couple' | 'story' | 'events' | 'gallery' | 'theme' | 'rsvp';

function SectionToggleCard({
  title,
  description,
  enabled,
  onChange,
  badge,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  badge?: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        enabled
          ? 'bg-slate-50 border-slate-200'
          : 'bg-amber-50/70 border-amber-200/80 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-slate-800">{title}</span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {badge}
              </span>
            )}
            {!enabled && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Hidden on Website
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${title}`}
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
            enabled ? 'bg-slate-900' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function StudioEditorClient({
  initialData,
  initialTemplateId,
  initialSlug,
  weddingId: initialWeddingId,
  isPaid: initialIsPaid,
  returnedFromPayment = false,
  userEmail = null,
}: StudioEditorClientProps) {
  const [formData, setFormData] = useState<WeddingData>(initialData);
  const [isPaid, setIsPaid] = useState(initialIsPaid);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify({ data: initialData, template: initialTemplateId, slug: initialSlug }));
  const [templateId, setTemplateId] = useState<string>(initialTemplateId || 'royal-rajwada');
  const [slug, setSlug] = useState<string>(initialSlug || '');
  const [activeTab, setActiveTab] = useState<TabKey>('couple');
  const [currentWeddingId, setCurrentWeddingId] = useState<string>(initialWeddingId);
  const [viewMode, setViewMode] = useState<'mobile' | 'full'>('mobile');
  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [lastRemoved, setLastRemoved] = useState<{
    type: 'event' | 'milestone' | 'gallery';
    data: any;
    index: number;
    description: string;
  } | null>(null);

  const handleUndo = () => {
    if (!lastRemoved) return;
    if (lastRemoved.type === 'event') {
      setFormData(prev => {
        const events = [...prev.events];
        events.splice(lastRemoved.index, 0, lastRemoved.data);
        return { ...prev, events };
      });
    } else if (lastRemoved.type === 'milestone') {
      setFormData(prev => {
        const milestones = [...(prev.story.milestones || [])];
        milestones.splice(lastRemoved.index, 0, lastRemoved.data);
        return { ...prev, story: { ...prev.story, milestones } };
      });
    } else if (lastRemoved.type === 'gallery') {
      setFormData(prev => {
        const gallery = [...prev.gallery];
        gallery.splice(lastRemoved.index, 0, lastRemoved.data);
        return { ...prev, gallery };
      });
    }
    setLastRemoved(null);
  };

  const isDirty = savedSnapshot !== JSON.stringify({ data: formData, template: templateId, slug });

  const updateSectionVisibility = (key: keyof NonNullable<WeddingData['sections']>, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...(prev.sections || {}),
        [key]: value,
      },
    }));
  };

  const PreviewTemplate = getTemplateComponent(templateId);

  // Publish-readiness checklist calculation
  const missingReadinessFields = useMemo(() => {
    const missing: { label: string; tab: TabKey }[] = [];
    if (!formData.couple.brideName.trim()) missing.push({ label: "Bride's Name", tab: 'couple' });
    if (!formData.couple.groomName.trim()) missing.push({ label: "Groom's Name", tab: 'couple' });
    if (!formData.couple.weddingDate) missing.push({ label: "Wedding Date", tab: 'couple' });
    if (formData.sections?.showEvents !== false) {
      if (formData.events.length === 0) {
        missing.push({ label: "At least one ceremony event", tab: 'events' });
      } else {
        const first = formData.events[0];
        if (!first.eventName.trim()) missing.push({ label: "Ceremony Name", tab: 'events' });
        if (!first.date) missing.push({ label: "Ceremony Date", tab: 'events' });
        if (!first.venueName.trim()) missing.push({ label: "Venue Name", tab: 'events' });
      }
    }
    if (!slug.trim()) missing.push({ label: "URL Slug", tab: 'rsvp' });
    return missing;
  }, [formData, slug]);
  const isReadyToPublish = missingReadinessFields.length === 0;


  // Restore draft if returning from login or reload (only for 'new' invitation drafts)
  useEffect(() => {
    if (initialWeddingId === 'new') {
      try {
        const cached = localStorage.getItem('everafter_pending_draft');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.formData) setFormData(parsed.formData);
          if (parsed?.templateId) setTemplateId(parsed.templateId);
          if (parsed?.slug) setSlug(parsed.slug);
        }
      } catch {
        // ignore
      }
    }
  }, [initialWeddingId]);

  // Continuously persist unsaved draft for 'new' invitations to localStorage
  useEffect(() => {
    if (currentWeddingId === 'new') {
      try {
        localStorage.setItem(
          'everafter_pending_draft',
          JSON.stringify({ formData, templateId, slug, updatedAt: Date.now() })
        );
      } catch {
        // ignore
      }
    }
  }, [formData, templateId, slug, currentWeddingId]);

  // Updaters for nested state
  const updateCoupleField = (field: keyof WeddingData['couple'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      couple: { ...prev.couple, [field]: value },
    }));
  };

  const updateStoryField = (field: 'title' | 'content', value: string) => {
    setFormData((prev) => ({
      ...prev,
      story: { ...prev.story, [field]: value },
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        milestones: [
          ...(prev.story.milestones || []),
          { year: '2024', title: 'New Milestone', description: 'A special moment in our journey.' },
        ],
      },
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        milestones: (prev.story.milestones || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const milestones = [...(prev.story.milestones || [])];
      milestones[index] = { ...milestones[index], [field]: value };
      return {
        ...prev,
        story: { ...prev.story, milestones },
      };
    });
  };

  const addEvent = () => {
    const newEvent: VenueEvent = {
      id: crypto.randomUUID(),
      eventName: 'New Ceremony',
      date: formData.couple.weddingDate || '',
      startTime: '',
      endTime: '',
      venueName: '',
      venueAddress: '',
      googleMapsUrl: '',
    };
    setFormData((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
  };

  const removeEvent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const updateEvent = <K extends keyof VenueEvent,>(id: string, field: K, value: VenueEvent[K]) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const editVenueText = (id: string, field: 'venueName' | 'venueAddress', value: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.map((event) => event.id === id ? updateVenueText(event, field, value) : event),
    }));
  };

  const addGalleryImage = () => {
    const url = galleryUrl.trim();
    try {
      if (!['https:', 'http:'].includes(new URL(url).protocol)) throw new Error();
      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, url],
      }));
      setGalleryUrl('');
      setGalleryError('');
    } catch {
      setGalleryError('Enter a valid HTTP or HTTPS image URL.');
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  /** Persist current editor state to localStorage so it can be restored after login. */
  const savePendingDraft = () => {
    try {
      localStorage.setItem('everafter_pending_draft', JSON.stringify({ formData, templateId, slug }));
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setStatusMessage('');

    if (!userEmail) {
      try {
        localStorage.setItem('everafter_pending_draft', JSON.stringify({ formData, templateId, slug }));
      } catch {
        // ignore
      }
      setSaveStatus('error');
      setStatusMessage('Please sign in to save your invitation. Redirecting to sign in...');
      setTimeout(() => {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      }, 1000);
      return;
    }

    startTransition(async () => {
      const res = await saveWeddingDraft({
        weddingId: currentWeddingId,
        slug,
        templateId,
        weddingData: formData,
      });

      if (res.success && res.weddingId) {
        setCurrentWeddingId(res.weddingId);
        if (res.slug) setSlug(current => current === slug ? res.slug! : current);
        setSavedSnapshot(JSON.stringify({ data: formData, template: templateId, slug: res.slug || slug }));
        window.history.replaceState(null, '', `/studio/${res.weddingId}`);
        try { localStorage.removeItem('everafter_pending_draft'); } catch {}
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setStatusMessage(res.error || 'Failed to save changes.');
      }
    });
  };

  return (
    <div className="studio-shell" data-panel={mobilePanel}>
      <div className="mobile-view-switch" aria-label="Studio view">
        <button type="button" aria-pressed={mobilePanel === 'edit'} onClick={() => setMobilePanel('edit')}>Edit invitation</button>
        <button type="button" aria-pressed={mobilePanel === 'preview'} onClick={() => setMobilePanel('preview')}>Live preview ↗</button>
      </div>
      {/* LEFT PANEL: Structured Data Form */}
      <div className="studio-editor">
        {/* Top Header */}
        <div className="studio-header">
          <div>
            <Link href="/" className="studio-brand">✳ everafter.</Link>
            <h1 className="text-xl text-slate-900 mt-1">Make it yours.</h1>
          </div>

          <div className="flex items-center gap-3">
            {isPaid && slug && currentWeddingId !== 'new' && (
              <Link
                href={`/${slug}`}
                target="_blank"
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <span>Open</span>
                <span>↗</span>
              </Link>
            )}

            <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
              {saveStatus === 'saving'
                ? 'Saving to cloud...'
                : isDirty
                ? '● Draft saved on this device'
                : userEmail
                ? '✓ Saved in account'
                : '✓ Saved'}
            </span>
            <button
              onClick={handleSave}
              disabled={isPending || saveStatus === 'saving'}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <span>✓ Saved!</span>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div role="alert" className="mx-6 mt-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">
            {statusMessage}
          </div>
        )}

        {/* Template Selector Bar */}
        <div className="studio-account-links">
          <Link href="/studio">My invitations</Link>
          {userEmail ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#62555d' }}>
              <span>Signed in as <strong style={{ color: '#2a1800' }}>{userEmail}</strong></span>
              <span>·</span>
              <form action={signOut} style={{ display: 'inline' }}>
                <button type="submit" style={{ background: 'none', border: 'none', color: '#a32939', padding: 0, minHeight: 'auto', textDecoration: 'underline', fontSize: '12px' }}>
                  Sign out
                </button>
              </form>
            </span>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/studio/new')}`}
              style={{ fontWeight: 650, color: '#663c51' }}
              onClick={savePendingDraft}
            >
              Sign in to save →
            </Link>
          )}
        </div>
        
        
        {/* Publish Readiness Banner */}
        <div className="studio-readiness-banner mx-5 my-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              {isReadyToPublish ? (
                <>
                  <span className="text-emerald-600">✓</span>
                  <span>Ready to publish (₹1,499)</span>
                </>
              ) : (
                <>
                  <span className="text-amber-600">●</span>
                  <span>{missingReadinessFields.length} essential {missingReadinessFields.length === 1 ? 'item' : 'items'} to complete</span>
                </>
              )}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {6 - missingReadinessFields.length}/6 complete
            </span>
          </div>
          {!isReadyToPublish && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingReadinessFields.map((item: { label: string; tab: TabKey }, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors text-[11px]"
                >
                  + Add {item.label} →
                </button>
              ))}
            </div>
          )}
        </div>

        <PublishPayButton weddingId={currentWeddingId} slug={slug} isPaid={isPaid}
          dirty={isDirty}
          returnedFromPayment={returnedFromPayment} onPaid={setIsPaid} />
        <div className="studio-design-picker">
          <label htmlFor="design-choice" className="text-xs font-semibold text-slate-600">Your design</label>
          <select
            id="design-choice"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <div aria-label="Invitation sections" className="studio-tabs">
          {[
            { key: 'couple', label: 'Couple' },
            { key: 'story', label: 'Story & Milestones' },
            { key: 'events', label: `Events (${formData.events.length})` },
            { key: 'gallery', label: `Gallery (${formData.gallery.length})` },
            { key: 'theme', label: 'Colors & Theme' },
            { key: 'rsvp', label: 'RSVP & URL' },
          ].map((tab) => (
            <button
              key={tab.key}
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="studio-form space-y-6" key={activeTab}>

          {/* Undo Recovery Toast */}
          {lastRemoved && (
            <div className="undo-recovery-banner p-3 rounded-lg bg-slate-900 text-white text-xs flex items-center justify-between shadow-md">
              <span>{lastRemoved.description}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="font-semibold text-amber-300 hover:text-amber-200 underline"
                >
                  Undo ↩
                </button>
                <button
                  type="button"
                  onClick={() => setLastRemoved(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Dismiss undo notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="section-intro"><p className="eyebrow">Your invitation · {['couple', 'story', 'events', 'gallery', 'theme', 'rsvp'].indexOf(activeTab) + 1} of 6</p><h2>{({ couple: 'It starts with you two.', story: 'Every love has a story.', events: 'Let the celebrations begin.', gallery: 'Moments worth keeping.', theme: 'Set the mood.', rsvp: 'Bring your people together.' })[activeTab]}</h2><p>Make it personal. Your preview updates as you go.</p></div>
          {/* TAB: COUPLE DETAILS */}
          {activeTab === 'couple' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800">Couple Names</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editor-field-1" className="text-xs font-medium text-slate-600">Bride&apos;s Name</label>
                    <input id="editor-field-1"
                      type="text"
                      value={formData.couple.brideName}
                      onChange={(e) => updateCoupleField('brideName', e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="editor-field-2" className="text-xs font-medium text-slate-600">Groom&apos;s Name</label>
                    <input id="editor-field-2"
                      type="text"
                      value={formData.couple.groomName}
                      onChange={(e) => updateCoupleField('groomName', e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label htmlFor="editor-field-3" className="text-xs font-medium text-slate-600">Wedding Date</label>
                    <input id="editor-field-3"
                      type="date"
                      value={formData.couple.weddingDate}
                      onChange={(e) => updateCoupleField('weddingDate', e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="editor-field-4" className="text-xs font-medium text-slate-600">Wedding Hashtag</label>
                    <input id="editor-field-4"
                      type="text"
                      value={formData.couple.hashtag || ''}
                      onChange={(e) => updateCoupleField('hashtag', e.target.value)}
                      placeholder="#RahulKiPriya"
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <SectionToggleCard
                    title="Live Countdown Timer"
                    description="Display a live ticking countdown clock down to your wedding date."
                    enabled={formData.sections?.showCountdown !== false}
                    onChange={(val) => updateSectionVisibility('showCountdown', val)}
                  />
                </div>
              </div>

              {/* SECTION: HERO COVER PHOTO */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800">Hero Cover Photo</h3>
                </div>
                <SectionToggleCard
                  title="Show Hero Cover Photo"
                  description="Display a prominent couple portrait photo in the invitation hero banner or arch."
                  badge="Hero Banner"
                  enabled={formData.sections?.showCoverPhoto !== false}
                  onChange={(val) => updateSectionVisibility('showCoverPhoto', val)}
                />
                {formData.sections?.showCoverPhoto !== false ? (
                  <div className="pt-1">
                    <ImageUploadDropzone
                      id="editor-field-5"
                      value={formData.couple.coverPhotoUrl}
                      onChange={(url) => updateCoupleField('coverPhotoUrl', url)}
                      label="Cover Portrait Photo"
                      recommendedText="Drag & drop your couple portrait photo here, or click to browse (JPG, PNG, WebP up to 10MB)."
                      aspectRatio="portrait"
                      allowUrlInput={true}
                    />
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-3">
                    <span>Cover photo is hidden on your invitation website. The header displays names and date cleanly.</span>
                    <button
                      type="button"
                      onClick={() => updateSectionVisibility('showCoverPhoto', true)}
                      className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded font-medium hover:bg-amber-300 text-[11px] shrink-0"
                    >
                      Turn On
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION: BRIDE & GROOM PORTRAITS & BIOS */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800">Bride & Groom Portraits</h3>
                </div>
                <SectionToggleCard
                  title="Show Individual Couple Photos"
                  description="Display separate portrait photos on the Bride and Groom cards."
                  badge="Couple Cards"
                  enabled={formData.sections?.showCouplePhotos !== false}
                  onChange={(val) => updateSectionVisibility('showCouplePhotos', val)}
                />

                {formData.sections?.showCouplePhotos !== false ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <ImageUploadDropzone
                        id="editor-field-bride-photo"
                        value={formData.couple.bridePhoto || ''}
                        onChange={(url) => updateCoupleField('bridePhoto', url)}
                        label="Bride's Portrait Photo"
                        recommendedText="Drag & drop Bride's photo here, or click to browse (JPG, PNG, WebP)."
                        aspectRatio="portrait"
                        allowUrlInput={true}
                      />
                    </div>
                    <div>
                      <ImageUploadDropzone
                        id="editor-field-groom-photo"
                        value={formData.couple.groomPhoto || ''}
                        onChange={(url) => updateCoupleField('groomPhoto', url)}
                        label="Groom's Portrait Photo"
                        recommendedText="Drag & drop Groom's photo here, or click to browse (JPG, PNG, WebP)."
                        aspectRatio="portrait"
                        allowUrlInput={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-3">
                    <span>Individual photos are hidden. The Bride and Groom cards will display their names and bios cleanly without photo arches.</span>
                    <button
                      type="button"
                      onClick={() => updateSectionVisibility('showCouplePhotos', true)}
                      className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded font-medium hover:bg-amber-300 text-[11px] shrink-0"
                    >
                      Turn On
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 space-y-4">
                  <h4 className="font-medium text-xs text-slate-700">Couple Bios (Optional)</h4>
                  <div>
                    <label htmlFor="editor-field-6" className="text-xs font-medium text-slate-600">Bride&apos;s Bio</label>
                    <textarea id="editor-field-6"
                      rows={3}
                      value={formData.couple.brideBio || ''}
                      onChange={(e) => updateCoupleField('brideBio', e.target.value)}
                      placeholder="A brief note or message from the bride..."
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="editor-field-7" className="text-xs font-medium text-slate-600">Groom&apos;s Bio</label>
                    <textarea id="editor-field-7"
                      rows={3}
                      value={formData.couple.groomBio || ''}
                      onChange={(e) => updateCoupleField('groomBio', e.target.value)}
                      placeholder="A brief note or message from the groom..."
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STORY & MILESTONES */}
          {activeTab === 'story' && (
            <div className="space-y-5">
              <SectionToggleCard
                title="Story & Milestones Section"
                description="Turn this section on or off. When turned off, the story and milestones are hidden from your public invitation."
                enabled={formData.sections?.showStory !== false}
                onChange={(val) => updateSectionVisibility('showStory', val)}
              />

              {formData.sections?.showStory === false && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>This section is currently <strong>turned off</strong> on your website. Your story drafts are safely kept here.</span>
                  <button
                    type="button"
                    onClick={() => updateSectionVisibility('showStory', true)}
                    className="font-semibold underline ml-2 hover:text-amber-900 cursor-pointer"
                  >
                    Turn On
                  </button>
                </div>
              )}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800">Our Story</h3>
                <div>
                  <label htmlFor="editor-field-8" className="text-xs font-medium text-slate-600">Story Title</label>
                    <input id="editor-field-8"
                    type="text"
                    value={formData.story.title}
                    onChange={(e) => updateStoryField('title', e.target.value)}
                    placeholder="e.g. How We Met"
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="editor-field-9" className="text-xs font-medium text-slate-600">Story Content</label>
                    <textarea id="editor-field-9"
                    rows={5}
                    value={formData.story.content}
                    onChange={(e) => updateStoryField('content', e.target.value)}
                    placeholder="Share how your journeys intertwined..."
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white leading-relaxed"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800">Relationship Milestones</h3>
                  <button
                    onClick={addMilestone}
                    className="text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1 rounded-lg"
                  >
                    + Add Milestone
                  </button>
                </div>

                {(formData.story.milestones || []).map((m, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => removeMilestone(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-sm"
                      title="Remove milestone"
                    >
                      ✕
                    </button>
                    <div className="grid grid-cols-[100px_1fr] gap-3">
                      <div>
                        <label htmlFor={`milestone-${idx}-10`} className="text-[11px] font-medium text-slate-500">Year</label>
                    <input id={`milestone-${idx}-10`}
                          type="text"
                          value={m.year}
                          onChange={(e) => updateMilestone(idx, 'year', e.target.value)}
                          className="w-full mt-1 border border-slate-300 rounded px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor={`milestone-${idx}-11`} className="text-[11px] font-medium text-slate-500">Milestone Title</label>
                    <input id={`milestone-${idx}-11`}
                          type="text"
                          value={m.title}
                          onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                          className="w-full mt-1 border border-slate-300 rounded px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`milestone-${idx}-12`} className="text-[11px] font-medium text-slate-500">Description</label>
                    <textarea id={`milestone-${idx}-12`}
                        rows={2}
                        value={m.description}
                        onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded px-2.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800">Wedding Events & Itinerary</h3>
                <button
                  onClick={addEvent}
                  className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg shadow-sm"
                >
                  + Add Ceremony
                </button>
              </div>

              {formData.events.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  No events added yet. Click &ldquo;+ Add Ceremony&rdquo; to add Haldi, Sangeet, Muhurtham or Reception.
                </div>
              ) : (
                formData.events.map((evt, idx) => (
                  <div key={evt.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-600">Event #{idx + 1}</span>
                      <button
                        onClick={() => removeEvent(evt.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Event
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`event-${evt.id}-13`} className="text-xs font-medium text-slate-600">Ceremony Name</label>
                    <input id={`event-${evt.id}-13`}
                          type="text"
                          value={evt.eventName}
                          onChange={(e) => updateEvent(evt.id, 'eventName', e.target.value)}
                          placeholder="e.g. Sangeet & Cocktail"
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-${evt.id}-14`} className="text-xs font-medium text-slate-600">Date</label>
                    <input id={`event-${evt.id}-14`}
                          type="date"
                          value={evt.date}
                          onChange={(e) => updateEvent(evt.id, 'date', e.target.value)}
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <p className="venue-picker-note">All times are in India Standard Time (Asia/Kolkata). An end time before the start time means the following day.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`event-${evt.id}-15`} className="text-xs font-medium text-slate-600">Start Time (24h)</label>
                    <input id={`event-${evt.id}-15`}
                          type="time"
                          value={evt.startTime}
                          onChange={(e) => updateEvent(evt.id, 'startTime', e.target.value)}
                          placeholder="18:00"
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-${evt.id}-16`} className="text-xs font-medium text-slate-600">End Time (24h)</label>
                    <input id={`event-${evt.id}-16`}
                          type="time"
                          value={evt.endTime}
                          onChange={(e) => updateEvent(evt.id, 'endTime', e.target.value)}
                          placeholder="23:00"
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                    </div>

                    {evt.date && evt.startTime && evt.endTime && !getEventTimeRange(evt) && (
                      <p className="venue-picker-note" role="status">Check the date and times. Start and end times must be different for calendar downloads.</p>
                    )}
                    <VenueLocationPicker
                      locationRevision={JSON.stringify([evt.venueName, evt.venueAddress, evt.googleMapsUrl])}
                      onSelectVenue={(venue) => setFormData((prev) => ({
                        ...prev,
                        events: prev.events.map((event) => event.id === evt.id ? { ...event, ...venue } : event),
                      }))}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`event-${evt.id}-17`} className="text-xs font-medium text-slate-600">Venue Name</label>
                    <input id={`event-${evt.id}-17`}
                          type="text"
                          value={evt.venueName}
                          onChange={(e) => editVenueText(evt.id, 'venueName', e.target.value)}
                          placeholder="e.g. Taj Falaknuma Palace"
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={`event-${evt.id}-18`} className="text-xs font-medium text-slate-600">Dress Code (Optional)</label>
                    <input id={`event-${evt.id}-18`}
                          type="text"
                          value={evt.dressCode || ''}
                          onChange={(e) => updateEvent(evt.id, 'dressCode', e.target.value)}
                          placeholder="e.g. Traditional Gold & Crimson"
                          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`event-${evt.id}-19`} className="text-xs font-medium text-slate-600">Venue Address</label>
                    <input id={`event-${evt.id}-19`}
                        type="text"
                        value={evt.venueAddress}
                        onChange={(e) => editVenueText(evt.id, 'venueAddress', e.target.value)}
                        placeholder="Full street address..."
                        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor={`event-${evt.id}-20`} className="text-xs font-medium text-slate-600">Google Maps URL</label>
                    <input id={`event-${evt.id}-20`}
                        type="url"
                        value={evt.googleMapsUrl}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          events: prev.events.map((event) => event.id === evt.id
                            ? { ...event, googleMapsUrl: e.target.value, googlePlaceId: undefined, lat: undefined, lng: undefined }
                            : event),
                        }))}
                        placeholder="https://maps.google.com/..."
                        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-5">
              <SectionToggleCard
                title="Photo Gallery Section"
                description="Turn photo gallery on or off. When turned off, the gallery section will not be visible on your website."
                enabled={formData.sections?.showGallery !== false}
                onChange={(val) => updateSectionVisibility('showGallery', val)}
              />

              {formData.sections?.showGallery === false && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>The photo gallery is currently <strong>turned off</strong> on your website.</span>
                  <button
                    type="button"
                    onClick={() => updateSectionVisibility('showGallery', true)}
                    className="font-semibold underline ml-2 hover:text-amber-900 cursor-pointer"
                  >
                    Turn On
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800">Photo Gallery</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {formData.gallery.length} {formData.gallery.length === 1 ? 'photo' : 'photos'} added
                </span>
              </div>

              <MultiImageGalleryDropzone
                images={formData.gallery}
                onAddImages={(newUrls) => {
                  setFormData((prev) => ({
                    ...prev,
                    gallery: [...prev.gallery, ...newUrls],
                  }));
                }}
                onRemoveImage={removeGalleryImage}
              />

              <div className="pt-1">
                <details className="text-xs text-slate-600 group">
                  <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900 list-none flex items-center gap-1.5 py-1">
                    <span>+ Or paste photo link directly</span>
                  </summary>
                  <div className="pt-2">
                    <form className="gallery-add" onSubmit={(event) => { event.preventDefault(); addGalleryImage(); }}>
                      <label htmlFor="gallery-url" className="sr-only">Image URL</label>
                      <div><input id="gallery-url" type="url" required value={galleryUrl} onChange={(event) => setGalleryUrl(event.target.value)} placeholder="https://…" /><button type="submit">Add photo +</button></div>
                      {galleryError && <p role="alert">{galleryError}</p>}
                    </form>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.gallery.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                    <button
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs shadow transition-transform active:scale-90"
                      title={`Remove photo ${idx + 1}`} aria-label={`Remove photo ${idx + 1}`}>✕</button>
                  </div>
                ))}
              </div>

              {formData.gallery.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  No photos in your gallery yet. Drag and drop photos above or paste an image URL.
                </div>
              )}
            </div>
          )}

          {/* TAB: THEME & COLORS */}
          {activeTab === 'theme' && (
            <div className="space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-sm text-slate-800">Theme Styling &amp; Colors</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">Primary Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.theme.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, primaryColor: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.theme.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, primaryColor: e.target.value },
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Secondary Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.theme.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, secondaryColor: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.theme.secondaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, secondaryColor: e.target.value },
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="editor-field-21" className="text-xs font-medium text-slate-600">Typography Font Style</label>
                    <select id="editor-field-21"
                  value={formData.theme.fontFamily}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      theme: {
                        ...prev.theme,
                        fontFamily: e.target.value as 'serif' | 'sans' | 'playfair',
                      },
                    }))
                  }
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="serif">Classic Serif (Traditional &amp; Elegant)</option>
                  <option value="sans">Modern Sans-Serif (Clean &amp; Minimal)</option>
                  <option value="playfair">Playfair / Editorial (High Fashion)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <SectionToggleCard
                  title="Background Music Player"
                  description="Enable floating background audio player with mute/unmute control."
                  enabled={formData.sections?.showMusic !== false}
                  onChange={(val) => updateSectionVisibility('showMusic', val)}
                />
                <div>
                  <label htmlFor="editor-music-url" className="text-xs font-medium text-slate-600">Background Audio URL (.mp3)</label>
                  <input
                    id="editor-music-url"
                    type="url"
                    value={formData.theme.backgroundMusicUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, backgroundMusicUrl: e.target.value },
                      }))
                    }
                    placeholder="https://example.com/wedding-audio.mp3"
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Direct audio URL (MP3 or AAC). Plays upon opening the invitation.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RSVP & URL */}
          {activeTab === 'rsvp' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800">Public Link / Invitation Slug</h3>
                <div>
                  <label className="text-xs font-medium text-slate-600">Unique URL Slug</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-400">/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="priya-weds-rahul"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Letters, numbers, and hyphens only (e.g. <code>priya-weds-rahul</code>).
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800">RSVP Configuration</h3>
                <SectionToggleCard
                  title="Guest RSVP Form"
                  description="Turn RSVP on or off. When turned off, guests will not see an RSVP form on your website."
                  enabled={formData.sections?.showRsvp !== false && formData.rsvpConfig.enabled}
                  onChange={(val) => {
                    updateSectionVisibility('showRsvp', val);
                    setFormData((prev) => ({
                      ...prev,
                      rsvpConfig: { ...prev.rsvpConfig, enabled: val },
                      sections: { ...(prev.sections || {}), showRsvp: val },
                    }));
                  }}
                />

                <div>
                  <label htmlFor="editor-field-22" className="text-xs font-medium text-slate-600">RSVP Deadline Date</label>
                    <input id="editor-field-22"
                    type="date"
                    value={formData.rsvpConfig.deadline || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rsvpConfig: { ...prev.rsvpConfig, deadline: e.target.value },
                      }))
                    }
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rsvpConfig.askDietaryPreference}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rsvpConfig: {
                          ...prev.rsvpConfig,
                          askDietaryPreference: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-700">Ask Guests for Dietary Preferences</span>
                </label>

                <div>
                  <label htmlFor="editor-field-23" className="text-xs font-medium text-slate-600">WhatsApp RSVP Number (Optional)</label>
                    <input id="editor-field-23"
                    type="text"
                    value={formData.rsvpConfig.whatsappNumber || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rsvpConfig: { ...prev.rsvpConfig, whatsappNumber: e.target.value },
                      }))
                    }
                    placeholder="+919876543210"
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Guests can RSVP instantly via WhatsApp with pre-filled event attendance details.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Mobile Frame Preview */}
      <div className="studio-preview">
        {/* Preview Device Bar */}
        <div className="preview-toolbar">
          <span><span className="preview-dot" /> Live preview</span>
          <button
            onClick={() => setViewMode('mobile')}
            aria-pressed={viewMode === 'mobile'}
            className={`px-2.5 py-0.5 rounded-full font-medium ${
              viewMode === 'mobile' ? 'bg-white text-slate-900' : 'hover:text-white'
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setViewMode('full')}
            aria-pressed={viewMode === 'full'}
            className={`px-2.5 py-0.5 rounded-full font-medium ${
              viewMode === 'full' ? 'bg-white text-slate-900' : 'hover:text-white'
            }`}
          >
            Wide
          </button>
        </div>

        {/* Device Frame */}
        {viewMode === 'mobile' ? (
          <div className="preview-canvas preview-mobile">
            {!isPaid && <div className="preview-watermark">DRAFT PREVIEW · MADE WITH EVERAFTER</div>}
            <PreviewTemplate
              data={formData}
              weddingId={currentWeddingId}
              isPreview={true}
              isPaid={isPaid}
            />
          </div>
        ) : (
          <div className="preview-canvas preview-wide">
            {!isPaid && <div className="preview-watermark">DRAFT PREVIEW · MADE WITH EVERAFTER</div>}
            <PreviewTemplate
              data={formData}
              weddingId={currentWeddingId}
              isPreview={true}
              isPaid={isPaid}
            />
          </div>
        )}
      </div>
    </div>
  );
}
