import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../.env'
);

const envText = readFileSync(envPath, 'utf8');

test('local backend configuration matches localhost frontend origins', () => {
  assert.match(envText, /CORS_ORIGIN="http:\/\/localhost:5173,http:\/\/localhost:5174,http:\/\/localhost:5175"/);
  assert.match(envText, /FRONTEND_URL="http:\/\/localhost:5173"/);
  assert.match(envText, /ADMIN_FRONTEND_URL="http:\/\/localhost:5174"/);
  assert.match(envText, /ORGANIZER_FRONTEND_URL="http:\/\/localhost:5175"/);
});

test('local Mongo connection uses the existing live database name casing', () => {
  assert.match(envText, /MONGO_URI="mongodb:\/\/mongo:27017\/CRT"/);
});
