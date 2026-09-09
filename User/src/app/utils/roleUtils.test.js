import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRoleHomePath,
  resolveRedirectTarget,
} from './roleUtils.js';

test('user role resolves to internal login path', () => {
  assert.equal(getRoleHomePath('USER'), '/profile');
});

test('organizer role resolves to the organizer dashboard URL from user app', () => {
  assert.equal(
    getRoleHomePath('ORGANIZER'),
    'http://localhost:5175/organizer/dashboard'
  );
});

test('admin role resolves to the admin dashboard URL from user app', () => {
  assert.equal(
    getRoleHomePath('ADMIN'),
    'http://localhost:5174/admin/dashboard'
  );
});

test('absolute organizer URLs are preserved for browser redirect instead of router navigate', () => {
  assert.equal(
    resolveRedirectTarget('http://localhost:5175/organizer/dashboard'),
    'http://localhost:5175/organizer/dashboard'
  );
  assert.equal(
    resolveRedirectTarget('http://localhost:5175/organizer/login'),
    'http://localhost:5175/organizer/login'
  );
  assert.equal(resolveRedirectTarget('/profile'), '/profile');
});
