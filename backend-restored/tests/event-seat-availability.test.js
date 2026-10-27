import test from "node:test";
import assert from "node:assert/strict";
import { createEventSchema, updateEventSchema } from "../src/schema/event.schema.js";

const validCreatePayload = {
    title: "Seat Availability Test",
    category: "Test",
    eventMode: "Offline",
};

test("create accepts Available without a seat quantity", () => {
    const result = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Available",
        },
    });

    assert.equal(result.success, true);
    assert.equal("totalSeats" in result.data.body, false);
});

test("create accepts Not Available without a seat quantity", () => {
    const result = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Not Available",
        },
    });

    assert.equal(result.success, true);
    assert.equal("totalSeats" in result.data.body, false);
});

test("create requires and preserves custom availability details", () => {
    const missingDetails = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Other",
            customSeatDetails: "   ",
        },
    });
    const validDetails = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Other",
            customSeatDetails: "Invitation only",
        },
    });

    assert.equal(missingDetails.success, false);
    assert.equal(validDetails.success, true);
    assert.equal(validDetails.data.body.customSeatDetails, "Invitation only");
});

test("create rejects unknown availability values and overlong custom details", () => {
    const invalidAvailability = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Limited",
        },
    });
    const invalidDetails = createEventSchema.safeParse({
        body: {
            ...validCreatePayload,
            seatAvailability: "Other",
            customSeatDetails: "x".repeat(501),
        },
    });

    assert.equal(invalidAvailability.success, false);
    assert.equal(invalidDetails.success, false);
});

test("edit accepts legacy seat quantities and validates custom availability", () => {
    const legacyEvent = updateEventSchema.safeParse({
        body: {
            seatAvailability: "Available",
            totalSeats: 120,
        },
        params: { id: "event-id" },
    });
    const missingDetails = updateEventSchema.safeParse({
        body: {
            seatAvailability: "Other",
        },
        params: { id: "event-id" },
    });
    const customEvent = updateEventSchema.safeParse({
        body: {
            seatAvailability: "Other",
            customSeatDetails: "Registration by invitation",
        },
        params: { id: "event-id" },
    });

    assert.equal(legacyEvent.success, true);
    assert.equal(legacyEvent.data.body.totalSeats, 120);
    assert.equal(missingDetails.success, false);
    assert.equal(customEvent.success, true);
    assert.equal(customEvent.data.body.customSeatDetails, "Registration by invitation");
});
