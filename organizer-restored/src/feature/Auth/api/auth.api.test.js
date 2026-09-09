import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeAuthResponse } from './responseUtils.js';

test('normalizeAuthResponse unwraps backend success payloads', () => {
  const response = {
    success: true,
    message: 'OTP sent',
    statusCode: 200,
    data: {
      email: 'organizer@example.com',
      otpSent: true,
      debugOtp: '123456',
    },
  };

  assert.deepEqual(normalizeAuthResponse(response), response.data);
  assert.equal(normalizeAuthResponse(response).debugOtp, '123456');
  assert.equal(normalizeAuthResponse({ data: { emails: ['a@b.com'] } }).emails[0], 'a@b.com');
});
