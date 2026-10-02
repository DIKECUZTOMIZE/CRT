import test from 'node:test';
import assert from 'node:assert/strict';

import { hydrateLocationFromUser, normalizeLocation } from './location.slice.js';

test('normalizeLocation keeps the India fallback only when no meaningful state or city is provided', () => {
  const result = normalizeLocation({ country: 'India', state: 'India', city: 'All India' });

  assert.deepEqual(result, {
    country: 'India',
    state: 'India',
    city: 'All India',
    isSelected: false,
  });
});

test('normalizeLocation accepts a real selection when isSelected is true', () => {
  const result = normalizeLocation({ country: 'India', state: 'Delhi', city: 'Noida', isSelected: true });

  assert.deepEqual(result, {
    country: 'India',
    state: 'Delhi',
    city: 'Noida',
    isSelected: true,
  });
});

test('hydrateLocationFromUser reads the saved user location only when the user actually selected it', () => {
  const result = hydrateLocationFromUser({
    location: { country: 'India', state: 'Maharashtra', city: 'Mumbai', isSelected: true },
  });

  assert.deepEqual(result, {
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    isSelected: true,
  });
});

test('normalizeLocation accepts a meaningful state/city even when isSelected is missing', () => {
  const result = normalizeLocation({ country: 'India', state: 'Assam', city: 'Guwahati' });

  assert.deepEqual(result, {
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    isSelected: true,
  });
});
