import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, "CompetitionCard.jsx");
const source = fs.readFileSync(sourcePath, "utf8");
const blockStart = source.indexOf("const getSeatAvailabilityText = (item) => {");
const blockEnd = source.indexOf("export const CompetitionCard", blockStart);
const extracted = source.slice(blockStart, blockEnd);
const getSeatAvailabilityText = new Function(
  `${extracted}; return getSeatAvailabilityText;`
)();

test("competition cards display all supported availability states", () => {
  assert.equal(getSeatAvailabilityText({ seatAvailability: "Available" }), "Limited seats");
  assert.equal(getSeatAvailabilityText({ seatAvailability: "Not Available" }), "Sold out");
  assert.equal(
    getSeatAvailabilityText({
      seatAvailability: "Other",
      customSeatDetails: "Registration by invitation",
    }),
    "Registration by invitation"
  );
});

test("competition cards continue displaying legacy seat quantities", () => {
  assert.equal(
    getSeatAvailabilityText({
      seatAvailability: "Available",
      totalSeats: 120,
    }),
    "120 seats left"
  );
});
