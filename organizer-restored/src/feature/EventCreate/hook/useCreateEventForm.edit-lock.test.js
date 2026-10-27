import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, 'useCreateEventForm.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const blockStart = source.indexOf('const isEditLockedByStatus = (event) => {');
const blockEnd = source.indexOf('const sanitizeEventPayload = (formData) => {');
const extracted = source.slice(blockStart, blockEnd);
const runtime = new Function(
  `${extracted}; return { isEditLockedByStatus };`
)();
const { isEditLockedByStatus } = runtime;

test('completed events stay locked from further edits', () => {
  assert.equal(isEditLockedByStatus({ status: 'completed' }), true);
  assert.equal(isEditLockedByStatus({ status: 'completed', completionConfirmedAt: '2026-09-26T00:00:00.000Z' }), true);
});

test('ended events remain editable until final completion', () => {
  assert.equal(isEditLockedByStatus({ status: 'ended' }), false);
  assert.equal(isEditLockedByStatus({ status: 'live' }), false);
});
