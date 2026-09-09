import test from 'node:test';
import assert from 'node:assert/strict';

import * as sessionDao from './session.dao.js';
import SessionModel from '../model/session.model.js';
import config from '../config/config.js';

test('auth cookies are configured for localhost refresh requests without breaking http development', () => {
  assert.equal(config.auth.cookie.user.refreshToken.sameSite, 'lax');
  assert.equal(config.auth.cookie.user.accessToken.sameSite, 'lax');
  assert.equal(config.auth.cookie.user.refreshToken.secure, false);
  assert.equal(config.auth.cookie.user.accessToken.secure, false);
});

test('updateSessionByUserId saves the document instead of double-hashing the refresh token', async () => {
  let saveCalled = false;

  const originalFindOne = SessionModel.findOne;
  const originalFindOneAndUpdate = SessionModel.findOneAndUpdate;

  try {
    SessionModel.findOne = async () => ({
      refreshToken: 'old-token',
      async save() {
        saveCalled = true;
        assert.equal(this.refreshToken, 'new-token');
        return this;
      },
    });

    SessionModel.findOneAndUpdate = async () => {
      throw new Error('findOneAndUpdate should not be used for refresh token rotation');
    };

    const updated = await sessionDao.updateSessionByUserId('user-123', {
      refreshToken: 'new-token',
    });

    assert.equal(saveCalled, true);
    assert.equal(updated.refreshToken, 'new-token');
  } finally {
    SessionModel.findOne = originalFindOne;
    SessionModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('updateSessionByUserId refreshes the session expiry time when the refresh token rotates', async () => {
  const originalFindOne = SessionModel.findOne;

  try {
    const previousExpiry = new Date(Date.now() - 60_000);

    SessionModel.findOne = async () => ({
      refreshToken: 'old-token',
      expiresAt: previousExpiry,
      async save() {
        assert.ok(this.expiresAt instanceof Date);
        assert.ok(this.expiresAt.getTime() > Date.now());
        assert.ok(this.expiresAt.getTime() > previousExpiry.getTime());
        return this;
      },
    });

    const updated = await sessionDao.updateSessionByUserId('user-456', {
      refreshToken: 'new-token',
    });

    assert.equal(updated.refreshToken, 'new-token');
  } finally {
    SessionModel.findOne = originalFindOne;
  }
});
