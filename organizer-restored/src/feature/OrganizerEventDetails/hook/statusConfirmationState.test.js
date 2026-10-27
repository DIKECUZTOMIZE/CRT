import assert from "node:assert/strict";
import test from "node:test";

import {
  captureStatusDraftBeforeCancellation,
  createStatusConfirmationCancellationState,
} from "./statusConfirmationState.js";

test("entering Final Cancel captures the current draft before confirmation", () => {
  assert.equal(captureStatusDraftBeforeCancellation("live", "upcoming"), "live");
});

test("cancelling Final Cancel confirmation restores the previous status draft and closes both modals", () => {
  assert.deepEqual(
    createStatusConfirmationCancellationState("live", "upcoming"),
    {
      statusDraft: "live",
      completionConfirmOpen: false,
      finalCancelWarningOpen: false,
    },
  );
});

test("status confirmation cancellation falls back to the persisted status", () => {
  assert.deepEqual(
    createStatusConfirmationCancellationState("", "postponed"),
    {
      statusDraft: "postponed",
      completionConfirmOpen: false,
      finalCancelWarningOpen: false,
    },
  );
});
