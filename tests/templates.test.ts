import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_REGISTRY, TEMPLATE_METADATA } from '../src/templates/index';

test('template registry contains all 4 pre-built templates including nikah-emerald', () => {
  const expectedTemplates = ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald'];
  for (const id of expectedTemplates) {
    assert.ok(TEMPLATE_REGISTRY[id], `Template ${id} must be registered`);
    assert.equal(typeof TEMPLATE_REGISTRY[id], 'function');
  }
});

test('template metadata contains prices and display names', () => {
  assert.equal(TEMPLATE_METADATA.length, 4);
  const ids = TEMPLATE_METADATA.map((m) => m.id);
  assert.deepEqual(ids, ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald']);
  for (const meta of TEMPLATE_METADATA) {
    assert.ok(meta.name.length > 0);
    assert.ok(meta.price > 0);
  }
});
