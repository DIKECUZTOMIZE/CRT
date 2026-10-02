import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidPortalUserForRole, getPortalStoredUser } from './sessionGuard.js';

test('portal validation accepts multi-role user payloads for the user portal', () => {
  const user = {
    id: 'u-1',
    email: 'user@example.com',
    roles: ['USER', 'ORGANIZER'],
    role: 'ORGANIZER',
  };

  assert.equal(isValidPortalUserForRole(user, 'USER'), true);
  assert.equal(getPortalStoredUser(JSON.stringify(user), 'USER')?.id, 'u-1');
});
