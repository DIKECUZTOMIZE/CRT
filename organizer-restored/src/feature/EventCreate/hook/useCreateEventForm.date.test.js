import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, 'useCreateEventForm.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

const blockStart = source.indexOf('const parseTimeValue = (value) => {');
const blockEnd = source.indexOf('const isEditLockedByStatus = (event) => {');
const extracted = source.slice(blockStart, blockEnd);

const runtime = new Function(
  `${extracted}; return { parseTimeValue, combineDateTime, deriveEventStatus };`
)();

const { parseTimeValue, combineDateTime, deriveEventStatus } = runtime;

const formatMs = (value) => new Date(value).getTime();

test('parseTimeValue supports HH:MM AM/PM', () => {
  const parsed = parseTimeValue('8:33 PM');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.getHours(), 20);
  assert.equal(parsed.getMinutes(), 33);
  assert.equal(parsed.getSeconds(), 0);
});

test('parseTimeValue supports HH:MM:SS AM/PM', () => {
  const parsed = parseTimeValue('8:33:10 PM');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.getHours(), 20);
  assert.equal(parsed.getMinutes(), 33);
  assert.equal(parsed.getSeconds(), 10);
});

test('parseTimeValue supports HH:MM 24-hour', () => {
  const parsed = parseTimeValue('20:33');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.getHours(), 20);
  assert.equal(parsed.getMinutes(), 33);
  assert.equal(parsed.getSeconds(), 0);
});

test('parseTimeValue supports HH:MM:SS 24-hour', () => {
  const parsed = parseTimeValue('20:33:10');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.getHours(), 20);
  assert.equal(parsed.getMinutes(), 33);
  assert.equal(parsed.getSeconds(), 10);
});

test('future event with seconds derives upcoming', () => {
  const now = Date.now();
  const futureDate = new Date(now + 60 * 60 * 1000).toISOString().slice(0, 10);
  const futureStart = new Date(now + 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  const futureEnd = new Date(now + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  const result = deriveEventStatus({
    eventDate: futureDate,
    eventEndDate: futureDate,
    eventStartTime: futureStart,
    eventEndTime: futureEnd,
    status: 'upcoming',
  });

  assert.equal(result, 'upcoming');
});

test('past event derives completed', () => {
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const dateString = pastDate.toISOString().slice(0, 10);
  const startTime = '09:00:00 AM';
  const endTime = '10:00:00 AM';

  const result = deriveEventStatus({
    eventDate: dateString,
    eventEndDate: dateString,
    eventStartTime: startTime,
    eventEndTime: endTime,
    status: 'upcoming',
  });

  assert.equal(result, 'completed');
});

test('date-only values without explicit status stay upcoming', () => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10);

  const result = deriveEventStatus({
    eventDate: dateString,
    eventEndDate: dateString,
  });

  assert.equal(result, 'upcoming');
});

test('combineDateTime preserves seconds when the input includes them', () => {
  const combined = combineDateTime('2026-09-26', '8:33:10 PM');
  const expected = new Date(2026, 8, 26, 20, 33, 10, 0);

  assert.ok(combined instanceof Date);
  assert.equal(combined.getHours(), 20);
  assert.equal(combined.getMinutes(), 33);
  assert.equal(combined.getSeconds(), 10);
  assert.equal(combined.getMilliseconds(), 0);
  assert.equal(combined.getTime(), expected.getTime());
});
