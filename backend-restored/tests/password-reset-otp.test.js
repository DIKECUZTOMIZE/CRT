import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import {
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  isPasswordResetEmailConfigured,
  getRegisteredEmailsService,
  resetPasswordWithOtpService,
} from '../src/module/auth/auth.service.js';
import * as userDao from '../src/dao/user.dao.js';
import * as sessionDao from '../src/dao/session.dao.js';
import { passwordResetConfirmSchema } from '../src/schema/auth.schema.js';
import { getOtpCountdown } from '../../../User/src/shared/utils/passwordResetTimer.js';
import UserModel from '../src/model/user.model.js';

test('getOtpCountdown formats expiry while the OTP is still valid and marks expired state after timeout', () => {
  const validState = getOtpCountdown(Date.now() + 65000);
  assert.equal(validState.isExpired, false);
  assert.equal(validState.text.includes('01:'), true);

  const expiredState = getOtpCountdown(Date.now() - 1000);
  assert.equal(expiredState.isExpired, true);
  assert.equal(expiredState.text, 'OTP expired');
});

test('createPasswordResetOtp generates a valid 6 digit OTP and expiry window', () => {
  const result = createPasswordResetOtp('user@example.com');

  assert.ok(result, 'otp entry should be created');
  assert.match(String(result.otp), /^\d{6}$/);
  assert.ok(Number.isFinite(result.expiresAt));
  assert.ok(result.expiresAt > Date.now());
});

test('verifyPasswordResetOtp rejects expired or incorrect OTP values', () => {
  const valid = createPasswordResetOtp('user@example.com');

  assert.equal(verifyPasswordResetOtp('user@example.com', valid.otp).valid, true);
  assert.equal(verifyPasswordResetOtp('user@example.com', '000000').valid, false);

  const expired = {
    otp: '123456',
    expiresAt: Date.now() - 1000,
  };

  assert.equal(verifyPasswordResetOtp('user@example.com', '123456', expired).valid, false);
});

test('password reset confirm schema accepts numeric OTP values and normalizes email', () => {
  const result = passwordResetConfirmSchema.safeParse({
    body: {
      email: 'ADMIN@CRT.COM',
      otp: 123456,
      newPassword: 'Admin@123456',
    },
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.body, {
    email: 'admin@crt.com',
    otp: '123456',
    newPassword: 'Admin@123456',
  });
});

test('resetPasswordWithOtpService rejects reusing the current password', async () => {
  const createdOtp = createPasswordResetOtp('user@example.com');

  await assert.rejects(
    () => resetPasswordWithOtpService({
      email: 'user@example.com',
      otp: createdOtp.otp,
      newPassword: 'OldPass@12345',
    }, {
      getUserByEmailOrUsername: async () => ({
        email: 'user@example.com',
        comparePassword: async (incomingPassword) => incomingPassword === 'OldPass@12345',
        save: async () => {},
      }),
      deleteSessionByUserId: async () => {},
    }),
    /New password must be different from your current password/
  );
});

test('requestPasswordResetService falls back to direct SMTP send when queueing fails', async () => {
  const originalFindOne = UserModel.findOne;
  UserModel.findOne = () => ({
    lean: async () => ({ email: 'user@example.com' }),
  });

  const directCalls = [];

  try {
    const { requestPasswordResetService } = await import('../src/module/auth/auth.service.js');
    const result = await requestPasswordResetService('user@example.com', {
      enqueuePasswordResetEmailFn: async () => {
        throw new Error('Redis unavailable');
      },
      sendPasswordResetEmailFn: async (...args) => {
        directCalls.push(args);
        return { devMode: false, otp: '123456' };
      },
    });

    assert.equal(result.otpSent, true);
    assert.equal(directCalls.length, 1);
  } finally {
    UserModel.findOne = originalFindOne;
  }
});

test('placeholder Gmail SMTP config is treated as unconfigured', () => {
  assert.equal(
    isPasswordResetEmailConfigured('smtp.gmail.com', 'your-email@gmail.com', 'your-16-digit-gmail-app-password'),
    false,
  );

  assert.equal(
    isPasswordResetEmailConfigured('smtp.gmail.com', 'realuser@gmail.com', 'abcdefghijklmnop'),
    true,
  );
});

test('getRegisteredEmailsService returns only user emails', async () => {
  const originalFind = UserModel.find;
  UserModel.find = (filter) => {
    assert.deepEqual(filter, { role: 'USER' });

    return {
      sort: () => ({
        lean: async () => [
          { email: 'admin@crt.com' },
          { email: 'organizer@crt.com' },
          { email: 'user@example.com' },
          { email: 'user@example.com' },
          { email: 'Another@Example.com' },
        ].filter((user) => user.email === 'user@example.com' || user.email === 'Another@Example.com'),
      }),
    };
  };

  try {
    const result = await getRegisteredEmailsService();
    assert.deepEqual(result.emails, ['user@example.com', 'another@example.com']);
  } finally {
    UserModel.find = originalFind;
  }
});
