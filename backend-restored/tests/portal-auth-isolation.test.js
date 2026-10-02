import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasPortalAuthCookie,
  isValidPortalUserForRole,
} from '../../User/src/feature/Auth/state/sessionGuard.js';

test('user portal rejects admin and organizer stored sessions', () => {
  assert.equal(isValidPortalUserForRole({ role: 'USER' }, 'USER'), true);
  assert.equal(isValidPortalUserForRole({ role: 'ADMIN' }, 'USER'), false);
  assert.equal(isValidPortalUserForRole({ role: 'ORGANIZER' }, 'USER'), false);
});

test('user portal restores from valid auth cookies even when local storage is empty', () => {
  const previousDocument = globalThis.document;

  globalThis.document = {
    cookie: 'userAccessToken=abc123; userRefreshToken=refresh123; path=/',
  };

  try {
    assert.equal(hasPortalAuthCookie('USER'), true);
    assert.equal(hasPortalAuthCookie('ADMIN'), false);
    assert.equal(hasPortalAuthCookie('ORGANIZER'), false);
  } finally {
    if (previousDocument) {
      globalThis.document = previousDocument;
    } else {
      delete globalThis.document;
    }
  }
});

test('user portal accepts the current cookie-based portal auth contract when cookies are present', () => {
  const previousDocument = globalThis.document;

  globalThis.document = { cookie: 'userAccessToken=abc123; path=/' };

  try {
    assert.equal(hasPortalAuthCookie('USER'), true);
    assert.equal(hasPortalAuthCookie('ADMIN'), false);
  } finally {
    if (previousDocument) {
      globalThis.document = previousDocument;
    } else {
      delete globalThis.document;
    }
  }
});
