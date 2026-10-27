export const getEventId = (event) => {
  const value = event?.id ?? event?._id ?? "";
  return String(value ?? "").trim();
};

export const DEFAULT_HOME_QUICK_FILTER = "all";
export const HOME_QUICK_FILTER_IDS = [
  "online",
  "offline",
  "free",
  "paid",
  "upcoming",
  "budget",
  "premium",
];

const HOME_QUICK_FILTER_GROUPS = {
  online: "mode",
  offline: "mode",
  free: "price",
  paid: "price",
};

export const parseHomeQuickFilters = (value) => {
  const availableFilters = new Set(HOME_QUICK_FILTER_IDS);
  const parsedFilters = [...new Set(
    String(value ?? "")
      .split(",")
      .map((filter) => filter.trim().toLowerCase())
      .filter((filter) => availableFilters.has(filter))
  )];

  return parsedFilters.length ? parsedFilters : [DEFAULT_HOME_QUICK_FILTER];
};

export const toggleHomeQuickFilter = (selectedFilters, filterName) => {
  if (!filterName || filterName === DEFAULT_HOME_QUICK_FILTER) {
    return [DEFAULT_HOME_QUICK_FILTER];
  }

  const currentFilters = Array.isArray(selectedFilters) ? selectedFilters : [selectedFilters];
  const activeFilters = currentFilters.filter(
    (filter) => filter && filter !== DEFAULT_HOME_QUICK_FILTER
  );
  const nextFilters = activeFilters.includes(filterName)
    ? activeFilters.filter((filter) => filter !== filterName)
    : [...activeFilters, filterName];

  return nextFilters.length ? nextFilters : [DEFAULT_HOME_QUICK_FILTER];
};

export const HOME_SECTION_DEFINITIONS = [
  { key: "popularCompetitions", title: "Popular Competitions" },
  { key: "recentCompetitions", title: "Recently Added" },
  { key: "nearbyCompetitions", title: "Nearby Events" },
  { key: "budgetFriendlyCompetitions", title: "Budget Friendly" },
  { key: "highBudgetCompetitions", title: "High Budget" },
];

export const getMinimumEntryPrice = (event) => {
  const entries = Array.isArray(event?.entries) ? event.entries : [];
  const prices = entries
    .map((entry) => {
      const price = entry?.price;
      if (typeof price !== "number" && !(typeof price === "string" && price.trim())) {
        return Number.NaN;
      }

      return Number(price);
    })
    .filter((price) => Number.isFinite(price) && price >= 0);

  return prices.length ? Math.min(...prices) : null;
};

export const matchesHomeQuickFilter = (event, filterNames) => {
  const selectedFilters = (Array.isArray(filterNames) ? filterNames : [filterNames]).filter(
    (filterName) => filterName && filterName !== DEFAULT_HOME_QUICK_FILTER
  );

  // Filters in the same category (price, mode) are OR-ed; different categories are AND-ed.
  const groups = new Map();
  selectedFilters.forEach((filterName) => {
    const group = HOME_QUICK_FILTER_GROUPS[filterName] || filterName;
    groups.set(group, [...(groups.get(group) || []), filterName]);
  });

  return [...groups.values()].every((names) =>
    names.some((filterName) => matchesSingleHomeQuickFilter(event, filterName))
  );
};

const matchesSingleHomeQuickFilter = (event, filterName) => {
  {
    const mode = String(event?.mode || event?.eventMode || "").trim().toLowerCase();
    const status = String(event?.status || "").trim().toLowerCase();
    const entryFee = getMinimumEntryPrice(event);

    if (filterName === "online") return mode.includes("online") || /online/i.test(event?.location || "");
    if (filterName === "offline") return mode.includes("offline") || mode.includes("in-person") || mode.includes("in person");
    if (filterName === "free") {
      const hasNoEntries = !Array.isArray(event?.entries) || event.entries.length === 0;
      return hasNoEntries || entryFee === 0;
    }
    if (filterName === "paid") return entryFee !== null && entryFee > 0;
    if (filterName === "upcoming") return status === "upcoming";
    if (filterName === "budget") return entryFee !== null && entryFee <= 50000;
    if (filterName === "premium") return entryFee !== null && entryFee > 50000;

    return true;
  }
};

export const getHomeBudgetSections = (events = []) => {
  const pricedEvents = (Array.isArray(events) ? events : [])
    .map((event) => ({ event, price: getMinimumEntryPrice(event) }))
    .filter(({ price }) => price !== null);

  const sortByPrice = (descending) => (left, right) =>
    descending ? right.price - left.price : left.price - right.price;

  return {
    budgetFriendlyCompetitions: pricedEvents
      .filter(({ price }) => price <= 50000)
      .sort(sortByPrice(false))
      .map(({ event }) => event),
    highBudgetCompetitions: pricedEvents
      .filter(({ price }) => price > 50000)
      .sort(sortByPrice(true))
      .map(({ event }) => event),
  };
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
