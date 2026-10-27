const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

const PLACEHOLDER_TEXT = new Set([
  "n/a",
  "na",
  "none",
  "not applicable",
  "not provided",
  "tbd",
  "to be announced",
  "test",
  "testing",
]);

const hasMeaningfulText = (value, placeholders = []) => {
  if (!hasText(value)) return false;
  const normalized = value.trim().toLowerCase();
  return !PLACEHOLDER_TEXT.has(normalized) && !placeholders.includes(normalized);
};

const hasPositiveAmount = (value) => {
  if (value === "" || value === null || value === undefined) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

const hasEntryData = (event) => {
  const entries = Array.isArray(event?.entries) ? event.entries : [];
  const entryFee = event?.entryFee;
  const hasEntry = entries.some((entry) => {
    if (!entry || typeof entry !== "object") return false;

    return (
      hasMeaningfulText(entry.customName, ["custom"]) ||
      hasMeaningfulText(entry.name, ["entry"]) ||
      hasMeaningfulText(entry.category, ["general / all", "general", "entry", "custom"]) ||
      hasMeaningfulText(entry.participationType, ["solo"]) ||
      hasPositiveAmount(entry.price ?? entry.amount) ||
      String(entry.isPaid || "").trim().toLowerCase() === "yes"
    );
  });

  if (entries.length > 0) {
    return hasEntry || hasMeaningfulText(entryFee?.note);
  }

  const categories = Array.isArray(entryFee?.categories)
    ? entryFee.categories
    : [];
  return (
    entryFee?.isFree === true ||
    hasPositiveAmount(entryFee?.amount ?? entryFee?.price) ||
    hasPositiveAmount(event?.fee) ||
    hasPositiveAmount(event?.entryFeeAmount) ||
    hasMeaningfulText(entryFee?.note) ||
    categories.some((category) => {
      if (!category || typeof category !== "object") return false;
      return (
        hasMeaningfulText(category.label ?? category.name ?? category.category, [
          "general / all",
          "general",
          "entry",
          "custom",
        ]) ||
        hasPositiveAmount(category.amount ?? category.price)
      );
    })
  );
};

const hasPrizeData = (event) =>
  hasPositiveAmount(event?.totalPrizePool) ||
  (Array.isArray(event?.prizes) &&
    event.prizes.some((prize) => {
      if (!prize || typeof prize !== "object") return false;
      return (
        hasMeaningfulText(prize.reward) ||
        hasMeaningfulText(prize.customTitle) ||
        hasMeaningfulText(prize.title) ||
        hasMeaningfulText(prize.name) ||
        hasPositiveAmount(prize.amount)
      );
    }));

const hasTextInRows = (rows, keys) =>
  Array.isArray(rows) &&
  rows.some((row) => {
    if (typeof row === "string") return hasMeaningfulText(row);
    if (!row || typeof row !== "object") return false;
    return keys.some((key) => hasMeaningfulText(row[key]));
  });

const hasRuleData = (event) => {
  const rules = Array.isArray(event?.eventRules)
    ? event.eventRules
    : event?.rules;

  return hasTextInRows(rules, ["text", "rule"]);
};

const hasSecurityData = (event) => {
  const requirements = Array.isArray(event?.securityRequirements)
    ? event.securityRequirements
    : event?.security;

  return hasTextInRows(requirements, ["text", "rule"]);
};

const hasOrganizerTeamData = (event) =>
  Array.isArray(event?.organizerTeam) &&
  event.organizerTeam.slice(0, 3).some(
    (member) =>
      member &&
      typeof member === "object" &&
      (hasMeaningfulText(member.name, ["team member"]) ||
        hasMeaningfulText(member.role, ["organizer team"])),
  );

export const getOptionalEventSectionVisibility = (event) => {
  const steps = Array.isArray(event?.participationSteps)
    ? event.participationSteps
    : [];
  const whatsapp = event?.organizerContact?.whatsapp;
  const organizerName = event?.organizerContact?.name;

  return {
    entry: hasEntryData(event),
    prizes: hasPrizeData(event),
    howToJoin: hasTextInRows(steps, ["title", "text"]),
    rules: hasRuleData(event),
    security: hasSecurityData(event),
    organizerTeam: hasOrganizerTeamData(event),
    contact:
      hasMeaningfulText(organizerName, ["official organizer"]) ||
      (hasText(whatsapp) && /\d/.test(whatsapp)),
  };
};

export const getEventStatusSectionVisibility = (status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return {
    postponed: normalizedStatus === "postponed",
    cancelled: normalizedStatus === "cancelled",
  };
};
