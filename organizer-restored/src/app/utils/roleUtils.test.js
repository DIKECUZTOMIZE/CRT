import test from 'node:test';
import assert from 'node:assert/strict';

import { getRoleHomePath, isOrganizerRole } from './roleUtils.js';

test('organizer role resolves to organizer dashboard', () => {
  assert.equal(getRoleHomePath('ORGANIZER'), '/organizer/dashboard');
});

test('admin role is not accepted as organizer access', () => {
  assert.equal(isOrganizerRole('ADMIN'), false);
  assert.equal(getRoleHomePath('ADMIN'), '/admin/dashboard');
});
