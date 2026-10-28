import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TEMPLATE_REGISTRY, TEMPLATE_METADATA } from '../src/templates/index';
import { createEmptyWeddingData } from '../src/lib/wedding-defaults';

test('template registry contains all 5 pre-built templates including bento-clay', () => {
  const expectedTemplates = ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald', 'bento-clay'];
  for (const id of expectedTemplates) {
    assert.ok(TEMPLATE_REGISTRY[id], `Template ${id} must be registered`);
    assert.equal(typeof TEMPLATE_REGISTRY[id], 'function');
  }
});

test('template metadata contains prices and display names', () => {
  assert.equal(TEMPLATE_METADATA.length, 5);
  const ids = TEMPLATE_METADATA.map((m) => m.id);
  assert.deepEqual(ids, ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald', 'bento-clay']);
  for (const meta of TEMPLATE_METADATA) {
    assert.ok(meta.name.length > 0);
    assert.ok(meta.price > 0);
  }
});

test('nikah emerald renders accurate couple data without invented family names or hardcoded locations', () => {
  const data = createEmptyWeddingData();
  data.couple = {
    brideName: 'Amina Farooq',
    groomName: 'Zayd Tariq',
    weddingDate: '2026-12-14',
    coverPhotoUrl: '',
    hashtag: '#ZaydAndAmina',
    brideBio: 'Bride personal note',
    groomBio: 'Groom personal note',
  };
  data.events = [{
    id: 'evt-1',
    eventName: 'Nikah Ceremony',
    date: '2026-12-14',
    startTime: '10:00',
    endTime: '13:00',
    venueName: 'Grand Hyatt',
    venueAddress: 'Banjara Hills, Hyderabad',
    googleMapsUrl: '',
  }];

  const Nikah = TEMPLATE_REGISTRY['nikah-emerald'];
  const html = renderToStaticMarkup(React.createElement(Nikah, { data, weddingId: 'test-wed', isPreview: true }));

  // Must render couple names and bios
  assert.match(html, /Amina Farooq/);
  assert.match(html, /Zayd Tariq/);
  assert.match(html, /Bride personal note/);
  assert.match(html, /Groom personal note/);

  // Must NOT render invented placeholder names
  assert.doesNotMatch(html, /Kunhimoideen/);
  assert.doesNotMatch(html, /Sainaba/);
  assert.doesNotMatch(html, /Yousef/);
  assert.doesNotMatch(html, /Fathima Rimza/);
  assert.doesNotMatch(html, /Muhammed Rahees/);

  // Must NOT render hardcoded Kerala location when wedding is in Hyderabad
  assert.doesNotMatch(html, /Kerala, India/);
  assert.match(html, /Hyderabad/);
});

test('templates format date-only strings consistently without overseas timezone rollback', () => {
  const data = createEmptyWeddingData();
  data.couple.weddingDate = '2026-12-14';
  data.events = [{
    id: 'evt-1',
    eventName: 'Reception',
    date: '2026-12-14',
    startTime: '18:00',
    endTime: '22:00',
    venueName: 'Taj Krishna',
    venueAddress: 'Road No 1, Banjara Hills',
    googleMapsUrl: '',
  }];

  for (const [id, Template] of Object.entries(TEMPLATE_REGISTRY)) {
    const html = renderToStaticMarkup(React.createElement(Template, { data, weddingId: 'test-wed', isPreview: true }));
    // All templates must format 2026-12-14 as 14 / December 14 / Dec 14, NEVER December 13
    assert.match(html, /December 14|Dec 14|14/, `Template ${id} must display day 14`);
    assert.doesNotMatch(html, /December 13|Dec 13/, `Template ${id} must not roll back to Dec 13`);
  }
});

test('templates do not render inert Active upon publish RSVP buttons', () => {
  const data = createEmptyWeddingData();
  data.rsvpConfig = {
    enabled: true,
    deadline: '2026-12-01',
    askDietaryPreference: false,
    whatsappNumber: '', // no whatsapp number configured
  };

  for (const [id, Template] of Object.entries(TEMPLATE_REGISTRY)) {
    const previewHtml = renderToStaticMarkup(React.createElement(Template, { data, weddingId: 'test-wed', isPreview: true }));
    assert.doesNotMatch(previewHtml, /Active upon publish/, `Template ${id} in preview must not show 'Active upon publish'`);

    const liveHtml = renderToStaticMarkup(React.createElement(Template, { data, weddingId: 'test-wed', isPreview: false }));
    assert.doesNotMatch(liveHtml, /Active upon publish/, `Template ${id} live must not show 'Active upon publish'`);
    assert.doesNotMatch(liveHtml, /<button[^>]*>Send RSVP<\/button>/, `Template ${id} live must not show dead Send RSVP button`);
  }
});

test('bento clay share does not preselect recipient phone and directions uses venue helper', () => {
  const data = createEmptyWeddingData();
  data.couple = {
    brideName: 'Diya',
    groomName: 'Rohan',
    weddingDate: '2026-12-14',
    coverPhotoUrl: '',
    hashtag: '#RohanDiya',
  };
  data.events = [{
    id: 'evt-1',
    eventName: 'Reception',
    date: '2026-12-14',
    startTime: '18:00',
    endTime: '22:00',
    venueName: 'Taj Falaknuma',
    venueAddress: 'Engine Bowli, Falaknuma, Hyderabad',
    googleMapsUrl: '',
  }];
  data.rsvpConfig = {
    enabled: true,
    deadline: '2026-12-01',
    askDietaryPreference: false,
    whatsappNumber: '+919876543210',
  };

  const Bento = TEMPLATE_REGISTRY['bento-clay'];
  const html = renderToStaticMarkup(React.createElement(Bento, { data, weddingId: 'test-wed', isPreview: true }));

  // General share action must NOT bind phone= to the couple's RSVP phone
  assert.match(html, /api\.whatsapp\.com\/send\?text=/);
  assert.doesNotMatch(html, /api\.whatsapp\.com\/send\?phone=/);

  // Directions must point to Google Maps directions for the venue address, not generic homepage
  assert.match(html, /maps\/dir\/\?/);
  assert.match(html, /Taj\+Falaknuma/);
});

test('nikah emerald renders custom story and photo gallery', () => {
  const data = createEmptyWeddingData();
  data.story = {
    title: 'How Our Story Began',
    content: 'We crossed paths during our university years.',
    milestones: [{ year: '2022', title: 'First Encounter', description: 'Met at the library' }],
  };
  data.gallery = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'];

  const Nikah = TEMPLATE_REGISTRY['nikah-emerald'];
  const html = renderToStaticMarkup(React.createElement(Nikah, { data, weddingId: 'test-wed', isPreview: true }));

  assert.match(html, /How Our Story Began/);
  assert.match(html, /We crossed paths during our university years/);
  assert.match(html, /First Encounter/);
  assert.match(html, /https:\/\/example\.com\/photo1\.jpg/);
});

test('all 5 template IDs resolve in query parameter selection', () => {
  const expectedTemplates = ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald', 'bento-clay'];
  for (const t of expectedTemplates) {
    const selected = t in TEMPLATE_REGISTRY ? t : 'royal-rajwada';
    assert.equal(selected, t, `Template query parameter ${t} must resolve to itself`);
  }
});

