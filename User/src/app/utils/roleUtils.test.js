import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRoleHomePath,
  resolveRedirectTarget,
} from './roleUtils.js';

test('user role resolves to internal login path', () => {
  assert.equal(getRoleHomePath('USER'), '/profile');
});

test('organizer role resolves to the production organizer dashboard URL', () => {
  assert.equal(
    getRoleHomePath('ORGANIZER'),
    'https://organizer.crtcompete.com/organizer/dashboard'
  );
});

test('admin role resolves to the production admin dashboard URL', () => {
  assert.equal(
    getRoleHomePath('ADMIN'),
    'https://admin.crtcompete.com/admin/dashboard'
  );
});

test('multi-role users with USER access stay in the user portal even when organizer is also present', () => {
  const user = {
    role: 'ORGANIZER',
    roles: ['USER', 'ORGANIZER'],
  };

  assert.equal(getRoleHomePath(user), '/profile');
  assert.equal(getRoleHomePath({ role: 'USER', roles: ['USER', 'ORGANIZER'] }), '/profile');
  assert.equal(getRoleHomePath({ role: 'ORGANIZER', roles: ['ORGANIZER'] }), 'https://organizer.crtcompete.com/organizer/dashboard');
});

test('local development routes stay on localhost instead of production URLs', () => {
  const originalWindow = globalThis.window;
  globalThis.window = { location: { hostname: 'localhost' } };

  try {
    assert.equal(getRoleHomePath('ORGANIZER'), 'http://localhost:5175/organizer/dashboard');
    assert.equal(getRoleHomePath('ADMIN'), 'http://localhost:5174/admin/dashboard');
  } finally {
    globalThis.window = originalWindow;
  }
});

test('absolute organizer URLs are preserved for browser redirect instead of router navigate', () => {
  assert.equal(
    resolveRedirectTarget('https://organizer.crtcompete.com/organizer/dashboard'),
    'https://organizer.crtcompete.com/organizer/dashboard'
  );
  assert.equal(
    resolveRedirectTarget('https://organizer.crtcompete.com/organizer/login'),
    'https://organizer.crtcompete.com/organizer/login'
  );
  assert.equal(resolveRedirectTarget('/profile'), '/profile');
});
