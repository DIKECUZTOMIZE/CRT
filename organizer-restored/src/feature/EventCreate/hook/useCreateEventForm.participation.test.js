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

test("selected participation modes enable participation in the payload", () => {
  for (const mode of ["Solo", "Team", "Both"]) {
    const payload = sanitizeEventPayload({
      hasParticipationType: "No",
      participationMode: mode,
    });

    assert.deepEqual(payload.participation, {
      enabled: true,
      mode,
      minTeamSize: undefined,
      maxTeamSize: undefined,
    });
  }
});

test("edit hydration preserves every saved participation mode", () => {
  for (const mode of ["Solo", "Team", "Both"]) {
    const formValues = populateFormFromEvent({
      participation: {
        enabled: true,
        mode,
        minTeamSize: mode === "Team" || mode === "Both" ? 2 : undefined,
        maxTeamSize: mode === "Team" || mode === "Both" ? 8 : undefined,
      },
    });
    const payload = sanitizeEventPayload(formValues);

    assert.equal(formValues.participationMode, mode);
    assert.equal(payload.participation.enabled, true);
    assert.equal(payload.participation.mode, mode);
  }
});

test("team-size values remain numeric for Team and Both and are omitted for Solo", () => {
  for (const mode of ["Team", "Both"]) {
    const payload = sanitizeEventPayload({
      hasParticipationType: "No",
      participationMode: mode,
      minTeamSize: "2",
      maxTeamSize: "8",
    });

    assert.equal(payload.participation.minTeamSize, 2);
    assert.equal(payload.participation.maxTeamSize, 8);
  }

  const soloPayload = sanitizeEventPayload({
    participationMode: "Solo",
    minTeamSize: "2",
    maxTeamSize: "8",
  });
  assert.equal(soloPayload.participation.minTeamSize, undefined);
  assert.equal(soloPayload.participation.maxTeamSize, undefined);
});

test("missing or invalid selection retains legacy enabled-flag fallback", () => {
  const disabledPayload = sanitizeEventPayload({
    hasParticipationType: "No",
    participationMode: "",
  });
  assert.deepEqual(disabledPayload.participation, {
    enabled: false,
    mode: "Solo",
    minTeamSize: undefined,
    maxTeamSize: undefined,
  });

  const enabledPayload = sanitizeEventPayload({
    hasParticipationType: "Yes",
    participationMode: "Unsupported",
  });
  assert.deepEqual(enabledPayload.participation, {
    enabled: true,
    mode: "Solo",
    minTeamSize: undefined,
    maxTeamSize: undefined,
  });
});

test("edit hydration preserves stored team sizes", () => {
  const formValues = populateFormFromEvent({
    participation: {
      enabled: true,
      mode: "Team",
      minTeamSize: 3,
      maxTeamSize: 6,
    },
  });
  const payload = sanitizeEventPayload(formValues);

  assert.equal(formValues.minTeamSize, 3);
  assert.equal(formValues.maxTeamSize, 6);
  assert.equal(payload.participation.minTeamSize, 3);
  assert.equal(payload.participation.maxTeamSize, 6);
});
