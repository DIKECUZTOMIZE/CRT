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
