'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { WeddingData, VenueEvent } from '@/types/wedding';
import { TEMPLATE_REGISTRY, TEMPLATE_METADATA } from '@/templates';
import { saveWeddingDraft } from '@/app/actions/wedding';
import { signOut } from '@/app/actions/auth';
import Link from 'next/link';
import VenueLocationPicker from '@/components/editor/VenueLocationPicker';
import { updateVenueText } from '@/utils/maps';
import { getEventTimeRange } from '@/utils/calendar';
import PublishPayButton from '@/components/editor/PublishPayButton';

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
  const isDirty = savedSnapshot !== JSON.stringify({ data: formData, template: templateId, slug });

  const PreviewTemplate = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY['royal-rajwada'];

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
            {TEMPLATE_METADATA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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

                <div>
                  <label htmlFor="editor-field-5" className="text-xs font-medium text-slate-600">Cover Portrait Photo URL</label>
                    <input id="editor-field-5"
                    type="url"
                    value={formData.couple.coverPhotoUrl}
                    onChange={(e) => updateCoupleField('coverPhotoUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Recommended portrait photo (HTTPS image link).</p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-sm text-slate-800">Couple Bios (Optional)</h3>
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
          )}

          {/* TAB: STORY & MILESTONES */}
          {activeTab === 'story' && (
            <div className="space-y-5">
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800">Photo Gallery</h3>
              </div>

              <form className="gallery-add" onSubmit={(event) => { event.preventDefault(); addGalleryImage(); }}>
                <label htmlFor="gallery-url">Image URL</label>
                <div><input id="gallery-url" type="url" required value={galleryUrl} onChange={(event) => setGalleryUrl(event.target.value)} placeholder="https://…" /><button type="submit">Add photo +</button></div>
                {galleryError && <p role="alert">{galleryError}</p>}
              </form>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.gallery.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white text-xs shadow"
                      title="Delete photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {formData.gallery.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Add your first photo using the image URL above.
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rsvpConfig.enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rsvpConfig: { ...prev.rsvpConfig, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-700">Enable Guest RSVPs on Invitation</span>
                </label>

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
