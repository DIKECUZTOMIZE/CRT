import test from 'node:test';
import assert from 'node:assert/strict';

import { isAdminUser, adminRoleAliases, getAdminRedirectPath } from './adminAuth.js';

test('admin role aliases are recognized', () => {
  assert.equal(isAdminUser({ role: 'ADMIN' }), true);
  assert.equal(isAdminUser({ role: 'admin' }), true);
  assert.equal(isAdminUser({ role: 'Admin' }), true);
  assert.equal(isAdminUser({ role: 'ORGANIZER' }), false);
  assert.equal(isAdminUser({ role: 'USER' }), false);
  assert.deepEqual(adminRoleAliases, ['ADMIN', 'admin']);
});

test('admin login redirect resolves to dashboard', () => {
  assert.equal(getAdminRedirectPath(), '/admin/dashboard');
});
