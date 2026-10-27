import test from "node:test";
import assert from "node:assert/strict";
import { createEventSchema, updateEventSchema } from "../src/schema/event.schema.js";

const validCreatePayload = {
    title: "Date and Time Test",
    category: "Test",
    eventMode: "Offline",
    seatAvailability: "Available",
};

// 2026-10-14 12:00:00 IST
const FIXED_NOW = Date.parse("2026-10-14T06:30:00.000Z");

const createWith = (fields) => createEventSchema.safeParse({ body: { ...validCreatePayload, ...fields } });
const hasPastStartIssue = (result) =>
    !result.success && result.error.issues.some((issue) => /cannot be in the past/.test(issue.message));

test("create accepts a future start and a start exactly at the current IST instant", (t) => {
    t.mock.method(Date, "now", () => FIXED_NOW);

    assert.equal(createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "12:01 PM", eventEndTime: "01:00 PM" }).success, true);
    assert.equal(createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "12:00 PM", eventEndTime: "01:00 PM" }).success, true);
    assert.equal(createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14" }).success, true);
});

test("create rejects a start that is strictly in the past in IST", (t) => {
    t.mock.method(Date, "now", () => FIXED_NOW);

    const pastTime = createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "11:59 AM", eventEndTime: "01:00 PM" });
    const pastDay = createWith({ eventDate: "2026-10-13", eventEndDate: "2026-10-14", eventStartTime: "11:59 PM", eventEndTime: "01:00 PM" });

    assert.equal(pastTime.success, false);
    assert.ok(hasPastStartIssue(pastTime));
    assert.equal(pastDay.success, false);
    assert.ok(hasPastStartIssue(pastDay));
});

test("create does not reject a future start only because the end is in the past", (t) => {
    t.mock.method(Date, "now", () => FIXED_NOW);

    const futureStartPastEnd = createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "12:30 PM", eventEndTime: "12:30 PM" });
    assert.equal(futureStartPastEnd.success, true);

    const badOrdering = createWith({ eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "01:00 PM", eventEndTime: "12:30 PM" });
    assert.equal(badOrdering.success, false);
    assert.ok(!hasPastStartIssue(badOrdering));
});

test("past-start boundary is the same instant under any server TZ", (t) => {
    // Run under TZ=UTC and TZ=Asia/Kolkata: 06:29Z/06:31Z around 12:00 IST must classify identically.
    const nowMock = t.mock.method(Date, "now", () => Date.parse("2026-10-14T06:29:00.000Z"));
    const fields = { eventDate: "2026-10-14", eventEndDate: "2026-10-14", eventStartTime: "12:00 PM", eventEndTime: "01:00 PM" };
    assert.equal(createWith(fields).success, true);
    nowMock.mock.mockImplementation(() => Date.parse("2026-10-14T06:31:00.000Z"));
    assert.equal(hasPastStartIssue(createWith(fields)), true);
});

test("update does not apply the past-start rule", (t) => {
    t.mock.method(Date, "now", () => FIXED_NOW);

    const result = updateEventSchema.safeParse({
        body: { eventDate: "2026-10-01", eventEndDate: "2026-10-01", eventStartTime: "09:00 AM", eventEndTime: "10:00 AM" },
        params: { id: "event-id" },
    });
    assert.equal(result.success, true);
});

test("create rejects an end date before the start date", () => {
    const result = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            eventDate: "2026-10-18",
            eventEndDate: "2026-10-17",
            eventStartTime: "09:00 AM",
            eventEndTime: "10:00 AM",
        },
    });

    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.at(-1) === "eventEndDate"));
});

test("create rejects an earlier end time on the same date", () => {
    const result = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            eventDate: "2026-10-17",
            eventEndDate: "2026-10-17",
            eventStartTime: "09:30 AM",
            eventEndTime: "09:29 AM",
        },
    });

    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.at(-1) === "eventEndTime"));
});

test("create allows equal same-day times and earlier clock times on a later date", (t) => {
    t.mock.method(Date, "now", () => FIXED_NOW);
    for (const datesAndTimes of [
        {
            eventDate: "2026-10-17",
            eventEndDate: "2026-10-17",
            eventStartTime: "09:30 AM",
            eventEndTime: "09:30 AM",
        },
        {
            eventDate: "2026-10-17",
            eventEndDate: "2026-10-18",
            eventStartTime: "11:00 PM",
            eventEndTime: "01:00 AM",
        },
    ]) {
        const result = createEventSchema.safeParse({
            body: { ...validCreatePayload, ...datesAndTimes },
        });

        assert.equal(result.success, true);
    }
});

test("update applies the same date and same-day time ordering rules", () => {
    const earlierEndTime = updateEventSchema.safeParse({
        body: {
            eventDate: "2026-10-17",
            eventEndDate: "2026-10-17",
            eventStartTime: "18:00",
            eventEndTime: "17:59",
        },
        params: { id: "event-id" },
    });
    const earlierEndDate = updateEventSchema.safeParse({
        body: {
            eventDate: "2026-10-18",
            eventEndDate: "2026-10-17",
        },
        params: { id: "event-id" },
    });

    assert.equal(earlierEndTime.success, false);
    assert.equal(earlierEndDate.success, false);
});
