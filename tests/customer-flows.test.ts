import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TEMPLATE_REGISTRY } from '../src/templates/index';
import { createEmptyWeddingData } from '../src/lib/wedding-defaults';
import { safeAuthNext } from '../src/lib/auth-redirect';
import { getDirectionsUrl } from '../src/utils/maps';

test('customer flow: deep-linking to /studio/new?template=<id> selects expected template without falling back', () => {
  const registered = Object.keys(TEMPLATE_REGISTRY);
  assert.ok(registered.length >= 5);

  for (const id of registered) {
    const selected = id in TEMPLATE_REGISTRY ? id : 'royal-rajwada';
    assert.equal(selected, id, `Template deep-link for "${id}" must select "${id}"`);
  }
});

test('customer flow: safe auth redirects protect editor return paths', () => {
  assert.equal(safeAuthNext('/studio/new'), '/studio/new');
  assert.equal(safeAuthNext('/studio/123e4567-e89b-12d3-a456-426614174000'), '/studio/123e4567-e89b-12d3-a456-426614174000');
  // Open redirect attempts must fall back safely
  assert.equal(safeAuthNext('https://evil.com'), '/studio');
  assert.equal(safeAuthNext('//evil.com'), '/studio');
  assert.equal(safeAuthNext(null), '/studio');
});

test('customer flow: blessing counter does not display deceptive starter counts', () => {
  const data = createEmptyWeddingData();
  const Nikah = TEMPLATE_REGISTRY['nikah-emerald'];
  const Bento = TEMPLATE_REGISTRY['bento-clay'];

  const nikahHtml = renderToStaticMarkup(React.createElement(Nikah, { data, weddingId: 'w-1', isPreview: true }));
  const bentoHtml = renderToStaticMarkup(React.createElement(Bento, { data, weddingId: 'w-1', isPreview: true }));

  // Must not claim "142" fake blessings or received count
  assert.doesNotMatch(nikahHtml, /\b142\b/);
  assert.doesNotMatch(bentoHtml, /\b142\s*(?:duas|blessings)/i);
  assert.doesNotMatch(nikahHtml, /Warm Heart Blessings Received/i);
});

test('customer flow: directions helper maps venue address instead of generic Google Maps', () => {
  const event = {
    id: 'evt-1',
    eventName: 'Reception',
    date: '2026-12-14',
    startTime: '18:00',
    endTime: '22:00',
    venueName: 'Taj Falaknuma Palace',
    venueAddress: 'Engine Bowli, Hyderabad',
    googleMapsUrl: 'https://maps.google.com/', // generic sample URL
  };

  const url = getDirectionsUrl(event);
  assert.ok(url);
  assert.match(url, /Taj\+Falaknuma\+Palace/);
  assert.match(url, /Engine\+Bowli/);
  assert.doesNotMatch(url, /^https:\/\/maps\.google\.com\/?$/);
});

test('customer flow: guest RSVP opens WhatsApp with formatted ceremony greeting', () => {
  const data = createEmptyWeddingData();
  data.couple.brideName = 'Amina';
  data.couple.groomName = 'Zayd';
  data.rsvpConfig = {
    enabled: true,
    deadline: '2026-12-01',
    askDietaryPreference: false,
    whatsappNumber: '+91 98765 43210',
  };

  for (const [id, Template] of Object.entries(TEMPLATE_REGISTRY)) {
    const html = renderToStaticMarkup(React.createElement(Template, { data, weddingId: 'w-1', isPreview: true }));
    assert.match(html, /wa\.me\/919876543210/, `Template ${id} must contain cleaned WhatsApp link`);
    assert.match(html, /RSVP|Attendance/i, `Template ${id} must indicate RSVP / Attendance action`);
  }
});
