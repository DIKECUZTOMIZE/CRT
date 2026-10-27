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
  `${extracted}; return { sanitizeEventPayload };`
)();
const { sanitizeEventPayload } = runtime;

test("blank category rows and incomplete title-only rows are omitted", () => {
  const payload = sanitizeEventPayload({
    prizes: [
      { category: "General / Open Event", amount: "", reward: "" },
      { category: "General / Open Event", amount: "   ", reward: "" },
      { category: "General / Open Event", position: "Winner" },
    ],
  });

  assert.deepEqual(payload.prizes, []);
});

test("valid cash and reward prizes are retained without defaulting missing amount", () => {
  const payload = sanitizeEventPayload({
    prizes: [
      { category: "Team Category", amount: 2500, position: "Winner", reward: "" },
      { category: "Solo Category", amount: "   ", reward: "Certificate" },
    ],
  });

  assert.equal(payload.prizes.length, 2);
  assert.equal(payload.prizes[0].amount, 2500);
  assert.equal("amount" in payload.prizes[1], true);
  assert.equal(payload.prizes[1].amount, undefined);
  assert.equal(payload.prizes[1].reward, "Certificate");
});

test("explicit numeric and string zero amounts remain valid cash prizes", () => {
  const payload = sanitizeEventPayload({
    prizes: [
      { category: "Special Award Category", amount: 0, reward: "" },
      { category: "Runner-up Category", amount: "0", reward: "" },
    ],
  });

  assert.equal(payload.prizes.length, 2);
  assert.equal(payload.prizes[0].amount, 0);
  assert.equal(payload.prizes[1].amount, 0);
});
