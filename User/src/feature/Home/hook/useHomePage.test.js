import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_HOME_QUICK_FILTER,
  HOME_SECTION_DEFINITIONS,
  dedupeHomeSections,
  getHomeBudgetSections,
  matchesHomeQuickFilter,
  parseHomeQuickFilters,
  toggleHomeQuickFilter,
} from "../utils/homeSectionUtils.js";

test("fresh home state defaults to All", () => {
  assert.equal(DEFAULT_HOME_QUICK_FILTER, "all");
  assert.equal(matchesHomeQuickFilter({ status: "upcoming" }, DEFAULT_HOME_QUICK_FILTER), true);
});

test("quick filters preserve every section and restore cards when All is selected", () => {
  const online = { id: "online", eventMode: "Online", entries: [{ price: 0 }] };
  const offline = { id: "offline", eventMode: "In Person", entries: [{ price: 25000 }] };
  const sectionCards = {
    popularCompetitions: [online, offline],
    recentCompetitions: [online, offline],
    nearbyCompetitions: [offline],
    budgetFriendlyCompetitions: [online, offline],
    highBudgetCompetitions: [],
  };
  const visibleSections = HOME_SECTION_DEFINITIONS;
  const filterSectionCards = (filter) =>
    Object.fromEntries(
      Object.entries(sectionCards).map(([key, events]) => [
        key,
        events.filter((event) => matchesHomeQuickFilter(event, filter)),
      ])
    );

  const onlineSections = filterSectionCards("online");

  assert.deepEqual(
    visibleSections.map(({ key }) => key),
    Object.keys(sectionCards)
  );
  assert.deepEqual(onlineSections.popularCompetitions, [online]);
  assert.deepEqual(onlineSections.recentCompetitions, [online]);
  assert.deepEqual(onlineSections.nearbyCompetitions, []);
  assert.deepEqual(onlineSections.budgetFriendlyCompetitions, [online]);
  assert.deepEqual(onlineSections.highBudgetCompetitions, []);

  const allSections = filterSectionCards(DEFAULT_HOME_QUICK_FILTER);
  assert.deepEqual(allSections, sectionCards);
});

test("deduplicates events within each home section while preserving cross-section membership", () => {
  const sections = {
    popularCompetitions: [{ id: "a", title: "Alpha" }, { id: "b", title: "Bravo" }, { id: "a", title: "Alpha" }],
    recentCompetitions: [{ id: "b", title: "Bravo" }, { id: "c", title: "Charlie" }, { id: "b", title: "Bravo" }],
    nearbyCompetitions: [{ id: "c", title: "Charlie" }, { id: "d", title: "Delta" }, { id: "c", title: "Charlie" }],
  };

  const result = dedupeHomeSections(sections);

  assert.deepEqual(result.popularCompetitions.map((event) => event.id), ["a", "b"]);
  assert.deepEqual(result.recentCompetitions.map((event) => event.id), ["b", "c"]);
  assert.deepEqual(result.nearbyCompetitions.map((event) => event.id), ["c", "d"]);
});

test("splits entry prices at 50000 and sorts both budget sections in opposite order", () => {
  const events = [
    { id: "high-low", entries: [{ price: 75000 }] },
    { id: "budget-mid", entries: [{ price: 25000 }] },
    { id: "boundary", entries: [{ price: 50000 }] },
    { id: "high-min", entries: [{ price: 50001 }] },
    { id: "free", entries: [{ price: 0 }] },
  ];

  const sections = getHomeBudgetSections(events);

  assert.deepEqual(
    sections.budgetFriendlyCompetitions.map((event) => event.id),
    ["free", "budget-mid", "boundary"],
  );
  assert.deepEqual(
    sections.highBudgetCompetitions.map((event) => event.id),
    ["high-low", "high-min"],
  );
  assert.equal(
    sections.budgetFriendlyCompetitions.some((event) =>
      sections.highBudgetCompetitions.some((highBudgetEvent) => highBudgetEvent.id === event.id)
    ),
    false,
  );
});

test("excludes events with missing or invalid entry prices and returns empty budget sections", () => {
  const sections = getHomeBudgetSections([
    { id: "missing", entries: [{}] },
    { id: "blank", entries: [{ price: " " }] },
    { id: "invalid", entries: [{ price: "not-a-price" }] },
    { id: "no-entries", entries: [] },
  ]);

  assert.deepEqual(sections, {
    budgetFriendlyCompetitions: [],
    highBudgetCompetitions: [],
  });
});

test("quick filters classify event mode, known prices, budget boundaries, and upcoming status", () => {
  const onlineFree = {
    eventMode: "Online",
    status: "upcoming",
    entries: [{ price: 0 }],
  };
  const offlinePaid = {
    eventMode: "In Person",
    status: "upcoming",
    entries: [{ price: 25000 }],
  };
  const boundaryPaid = { entries: [{ price: 50000 }] };
  const premiumPaid = { entries: [{ price: 50001 }] };
  const unpriced = { entries: [] };
  const invalidPrice = { entries: [{ price: "unknown" }] };

  assert.equal(matchesHomeQuickFilter(onlineFree, "all"), true);
  assert.equal(matchesHomeQuickFilter(onlineFree, "online"), true);
  assert.equal(matchesHomeQuickFilter(onlineFree, "offline"), false);
  assert.equal(matchesHomeQuickFilter(offlinePaid, "offline"), true);
  assert.equal(matchesHomeQuickFilter(offlinePaid, "online"), false);
  assert.equal(matchesHomeQuickFilter(onlineFree, "free"), true);
  assert.equal(matchesHomeQuickFilter(offlinePaid, "free"), false);
  assert.equal(matchesHomeQuickFilter(offlinePaid, "paid"), true);
  assert.equal(matchesHomeQuickFilter(onlineFree, "paid"), false);
  assert.equal(matchesHomeQuickFilter(onlineFree, "upcoming"), true);
  assert.equal(matchesHomeQuickFilter({ status: "completed" }, "upcoming"), false);
  assert.equal(matchesHomeQuickFilter({ status: "cancelled" }, "upcoming"), false);
  assert.equal(matchesHomeQuickFilter({ status: "postponed" }, "upcoming"), false);
  assert.equal(matchesHomeQuickFilter({ status: "upcoming" }, "upcoming"), true);
  assert.equal(matchesHomeQuickFilter(boundaryPaid, "budget"), true);
  assert.equal(matchesHomeQuickFilter(boundaryPaid, "premium"), false);
  assert.equal(matchesHomeQuickFilter(premiumPaid, "budget"), false);
  assert.equal(matchesHomeQuickFilter(premiumPaid, "premium"), true);

  assert.equal(matchesHomeQuickFilter(invalidPrice, "free"), false);
  for (const event of [unpriced, invalidPrice]) {
    assert.equal(matchesHomeQuickFilter(event, "paid"), false);
    assert.equal(matchesHomeQuickFilter(event, "budget"), false);
    assert.equal(matchesHomeQuickFilter(event, "premium"), false);
  }
});

test("free filter includes events with empty or missing entries only as Free", () => {
  for (const event of [{ entries: [] }, {}, { entries: undefined }]) {
    assert.equal(matchesHomeQuickFilter(event, "free"), true);
    assert.equal(matchesHomeQuickFilter(event, "paid"), false);
  }

  const positive = { entries: [{ price: 1000 }, { price: 2000 }] };
  assert.equal(matchesHomeQuickFilter(positive, "free"), false);
  assert.equal(matchesHomeQuickFilter(positive, "paid"), true);
  assert.equal(matchesHomeQuickFilter({ entries: [{ price: "0" }] }, "free"), true);
  assert.equal(matchesHomeQuickFilter({ entries: [{ price: 0 }, { price: 500 }] }, "free"), true);
  assert.equal(matchesHomeQuickFilter({ entries: [{ price: 0 }, { price: 500 }] }, "paid"), false);
});

test("quick filters combine with AND and preserve the default All selection", () => {
  const onlinePaidUpcoming = {
    eventMode: "Online",
    status: "upcoming",
    entries: [{ price: 25000 }],
  };
  const onlinePaidCancelled = {
    ...onlinePaidUpcoming,
    status: "cancelled",
  };
  const offlinePaidUpcoming = {
    ...onlinePaidUpcoming,
    eventMode: "Offline",
  };

  assert.equal(
    matchesHomeQuickFilter(onlinePaidUpcoming, ["online", "paid", "upcoming"]),
    true
  );
  assert.equal(
    matchesHomeQuickFilter(onlinePaidCancelled, ["online", "paid", "upcoming"]),
    false
  );
  assert.equal(
    matchesHomeQuickFilter(offlinePaidUpcoming, ["online", "paid", "upcoming"]),
    false
  );
  assert.deepEqual(toggleHomeQuickFilter(["all"], "online"), ["online"]);
  assert.deepEqual(toggleHomeQuickFilter(["online", "paid"], "upcoming"), ["online", "paid", "upcoming"]);
  assert.deepEqual(toggleHomeQuickFilter(["online"], "all"), ["all"]);
  assert.deepEqual(toggleHomeQuickFilter(["online"], "online"), ["all"]);
  assert.deepEqual(parseHomeQuickFilters("online,paid,upcoming,unknown,online"), ["online", "paid", "upcoming"]);
  assert.deepEqual(parseHomeQuickFilters(""), ["all"]);
});


test("same-category quick filters are OR-ed and different categories are AND-ed", () => {
  const onlineFree = { id: "of", eventMode: "Online", status: "upcoming", entries: [] };
  const onlinePaid = { id: "op", eventMode: "Online", status: "upcoming", entries: [{ price: 500 }] };
  const offlineFree = { id: "ff", eventMode: "Offline", status: "upcoming", entries: [{ price: 0 }] };
  const offlinePaid = { id: "fp", eventMode: "Offline", status: "upcoming", entries: [{ price: 500 }] };
  const events = [onlineFree, onlinePaid, offlineFree, offlinePaid];
  const pick = (filters) =>
    events.filter((event) => matchesHomeQuickFilter(event, filters)).map((event) => event.id);

  assert.deepEqual(pick(["free", "paid"]), ["of", "op", "ff", "fp"]);
  assert.deepEqual(pick(["free", "online"]), ["of"]);
  assert.deepEqual(pick(["free", "paid", "online"]), ["of", "op"]);
  assert.deepEqual(pick(["online", "offline"]), ["of", "op", "ff", "fp"]);
  assert.deepEqual(pick(["paid", "online"]), ["op"]);
  assert.deepEqual(pick(["free", "paid", "online", "upcoming"]), ["of", "op"]);
  assert.deepEqual(pick(["online", "paid", "free"].filter((name) => name !== "free")), ["op"]);
  assert.deepEqual(toggleHomeQuickFilter(["free", "paid", "online"], "free"), ["paid", "online"]);
});
