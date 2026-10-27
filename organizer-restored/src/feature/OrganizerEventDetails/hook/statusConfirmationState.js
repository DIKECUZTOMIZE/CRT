export const captureStatusDraftBeforeCancellation = (currentDraft, persistedStatus) =>
  currentDraft || persistedStatus || "upcoming";

export const createStatusConfirmationCancellationState = (previousDraft, persistedStatus) => ({
  statusDraft: captureStatusDraftBeforeCancellation(previousDraft, persistedStatus),
  completionConfirmOpen: false,
  finalCancelWarningOpen: false,
});
