import test from 'node:test';
import assert from 'node:assert/strict';

const expectRuntimeEnv = (key) => {
  const value = process.env[key];
  assert.ok(value, `${key} should be set by the running Docker environment for local development`);
  return value;
};

test('local backend configuration matches localhost frontend origins', () => {
  const corsOrigin = expectRuntimeEnv('CORS_ORIGIN');
  const frontendUrl = expectRuntimeEnv('FRONTEND_URL');
  const adminFrontendUrl = expectRuntimeEnv('ADMIN_FRONTEND_URL');
  const organizerFrontendUrl = expectRuntimeEnv('ORGANIZER_FRONTEND_URL');

  assert.equal(corsOrigin, 'http://localhost:5173,http://localhost:5174,http://localhost:5175');
  assert.equal(frontendUrl, 'http://localhost:5173');
  assert.equal(adminFrontendUrl, 'http://localhost:5174');
  assert.equal(organizerFrontendUrl, 'http://localhost:5175');
});

test('local Mongo connection uses the existing live database name casing', () => {
  const mongoUri = expectRuntimeEnv('MONGO_URI');
  assert.match(mongoUri, /^mongodb:\/\/(?:mongo|localhost):27017\/CRT$/);
});
