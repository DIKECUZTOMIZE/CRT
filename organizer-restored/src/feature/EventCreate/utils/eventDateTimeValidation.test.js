import test from "node:test";
import assert from "node:assert/strict";
import { isEndTimeOnOrAfterStartTime, isStartNotInPastIst } from "./eventDateTimeValidation.js";

test("rejects an end time before the start time on the same date", () => {
  assert.equal(
    isEndTimeOnOrAfterStartTime({
      startDate: "2026-10-17",
      endDate: "2026-10-17",
      startTime: "09:30 AM",
      endTime: "09:29 AM",
    }),
    false,
  );
});

test("allows the same time and a later time on the same date", () => {
  for (const endTime of ["09:30 AM", "10:00 AM"]) {
    assert.equal(
      isEndTimeOnOrAfterStartTime({
        startDate: "2026-10-17",
        endDate: "2026-10-17",
        startTime: "09:30 AM",
        endTime,
      }),
      true,
    );
  }
});

test("allows an earlier clock time when the event ends on a later date", () => {
  assert.equal(
    isEndTimeOnOrAfterStartTime({
      startDate: "2026-10-17",
      endDate: "2026-10-18",
      startTime: "11:00 PM",
      endTime: "01:00 AM",
    }),
    true,
  );
});

test("compares 24-hour times including seconds", () => {
  assert.equal(
    isEndTimeOnOrAfterStartTime({
      startDate: "2026-10-17",
      endDate: "2026-10-17",
      startTime: "14:30:10",
      endTime: "14:30:09",
    }),
    false,
  );
});

test("leaves invalid or missing times to the field-level validators", () => {
  assert.equal(
    isEndTimeOnOrAfterStartTime({
      startDate: "2026-10-17",
      endDate: "2026-10-17",
      startTime: "invalid",
      endTime: "09:00 AM",
    }),
    true,
  );
});

// 2026-10-14 12:00:00 IST
const NOW = Date.parse("2026-10-14T06:30:00.000Z");

test("accepts a future start and a start exactly at the current IST instant", () => {
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "12:01 PM", now: NOW }), true);
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "12:00 PM", now: NOW }), true);
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "", now: NOW }), true);
});

test("rejects a start that is strictly in the past in IST", () => {
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "11:59 AM", now: NOW }), false);
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-13", startTime: "11:59 PM", now: NOW }), false);
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-13", startTime: "", now: NOW }), false);
});

test("past-start boundary is the same instant regardless of timezone", () => {
  const input = { startDate: "2026-10-14", startTime: "12:00 PM" };
  assert.equal(isStartNotInPastIst({ ...input, now: Date.parse("2026-10-14T06:29:00.000Z") }), true);
  assert.equal(isStartNotInPastIst({ ...input, now: Date.parse("2026-10-14T06:31:00.000Z") }), false);
});

test("does not treat a past end as a past start and ignores invalid input", () => {
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "12:30 PM", now: NOW }), true);
  assert.equal(isStartNotInPastIst({ startDate: "", startTime: "12:00 PM", now: NOW }), true);
  assert.equal(isStartNotInPastIst({ startDate: "2026-10-14", startTime: "invalid", now: NOW }), true);
});
