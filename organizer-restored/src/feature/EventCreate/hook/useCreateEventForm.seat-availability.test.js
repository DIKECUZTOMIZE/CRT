import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, "useCreateEventForm.jsx");
const source = fs.readFileSync(sourcePath, "utf8");
const blockStart = source.indexOf("const removeEmpty = (value) => {");
const blockEnd = source.indexOf("export const useCreateEventForm =");
const extracted = source.slice(blockStart, blockEnd);
const runtime = new Function(
  `${extracted}; return { sanitizeEventPayload, populateFormFromEvent };`
)();
const { sanitizeEventPayload, populateFormFromEvent } = runtime;

test("Available and Not Available omit empty seat quantities from create payloads", () => {
  for (const seatAvailability of ["Available", "Not Available"]) {
    const payload = sanitizeEventPayload({
      seatAvailability,
      totalSeats: "",
      status: "upcoming",
    });

    assert.equal(payload.seatAvailability, seatAvailability);
    assert.equal("totalSeats" in payload, false);
  }
});

test("Custom availability details are trimmed and included in the payload", () => {
  const payload = sanitizeEventPayload({
    seatAvailability: "Other",
    customSeatDetails: "  Invitation only  ",
    totalSeats: "",
    status: "upcoming",
  });

  assert.equal(payload.seatAvailability, "Other");
  assert.equal(payload.customSeatDetails, "Invitation only");
  assert.equal("totalSeats" in payload, false);
});

test("edit hydration and payload sanitization preserve legacy seat quantities", () => {
  const formValues = populateFormFromEvent({
    seatAvailability: "Available",
    totalSeats: 120,
    customSeatDetails: "",
  });
  const payload = sanitizeEventPayload(formValues);

  assert.equal(formValues.totalSeats, 120);
  assert.equal(payload.totalSeats, 120);
  assert.equal(payload.seatAvailability, "Available");
});

test("edit hydration restores custom availability details", () => {
  const formValues = populateFormFromEvent({
    seatAvailability: "Other",
    customSeatDetails: "Registration by invitation",
  });
  const payload = sanitizeEventPayload(formValues);

  assert.equal(formValues.customSeatDetails, "Registration by invitation");
  assert.equal(payload.customSeatDetails, "Registration by invitation");
});
