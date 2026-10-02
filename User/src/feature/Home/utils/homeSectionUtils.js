export const getEventId = (event) => {
  const value = event?.id ?? event?._id ?? "";
  return String(value ?? "").trim();
};

export const dedupeEventsById = (events = []) => {
  const seen = new Set();

  return (Array.isArray(events) ? events : []).filter((event) => {
    const id = getEventId(event);

    if (!id) {
      return true;
    }

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

export const dedupeHomeSections = (sections = {}) => {
  const orderedKeys = [
    "popularCompetitions",
    "recentCompetitions",
    "nearbyCompetitions",
    "budgetFriendlyCompetitions",
    "highBudgetCompetitions",
  ];

  const dedupedSections = {};

  for (const key of orderedKeys) {
    const sourceEvents = Array.isArray(sections[key]) ? sections[key] : [];
    const seenIds = new Set();

    dedupedSections[key] = sourceEvents.filter((event) => {
      const id = getEventId(event);

      if (!id) {
        return true;
      }

      if (seenIds.has(id)) {
        return false;
      }

      seenIds.add(id);
      return true;
    });
  }

  return dedupedSections;
};
