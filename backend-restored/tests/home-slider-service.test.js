import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getHomeSliderSlidesService,
  normalizeHomeSliderSlide,
} from '../src/module/home-slider/home-slider.service.js';

test('normalizeHomeSliderSlide keeps a valid slider item shape', () => {
  const slide = normalizeHomeSliderSlide({
    title: 'Hackathon 2026',
    image: 'https://example.com/hero.jpg',
    images: ['https://example.com/hero.jpg', 'https://example.com/hero-2.jpg'],
    description: 'Developer events',
    order: 1,
    isActive: true,
  });

  assert.equal(slide.title, 'Hackathon 2026');
  assert.equal(slide.image, 'https://example.com/hero.jpg');
  assert.ok(Array.isArray(slide.images), 'images should be an array');
  assert.equal(slide.images.length, 2);
  assert.equal(slide.order, 1);
  assert.equal(slide.isActive, true);
});

test('getHomeSliderSlidesService always returns an array of slide objects', async () => {
  const slides = await getHomeSliderSlidesService();

  assert.ok(Array.isArray(slides), 'slides should be an array');
  slides.forEach((slide) => {
    assert.equal(typeof slide.title, 'string');
    assert.ok(Array.isArray(slide.images), 'images should be an array');
  });
});
