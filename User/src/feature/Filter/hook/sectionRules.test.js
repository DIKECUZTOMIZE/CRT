import assert from "node:assert/strict";
import { register } from "node:module";
import { describe, it } from "node:test";

// useHomePage.js pulls in React/router/axios; strip its imports so the real sorters load in Node.
const hooks = `export async function load(url, context, next) {
  const result = await next(url, context);
  if (url.endsWith("/Home/hook/useHomePage.js")) {
    const source = String(result.source).replace(/^import[\\s\\S]*?from\\s+["'][^"']+["'];?/gm, "");
    return { ...result, source };
  }
  return result;
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const { applySectionRule } = await import("./sectionRules.js");
const { byNearbyPriority, byNewestFirst, byPopularity } = await import("../../Home/hook/useHomePage.js");

const priced = (id, price) => ({ _id: id, entries: [{ price }] });
const ids = (list) => list.map((event) => event._id);

describe("applySectionRule", () => {
  const popularInput = Array.from({ length: 12 }, (_, index) => ({
    _id: `p${index}`,
    viewsCount: (index * 7) % 12,
    createdAt: new Date(2026, 0, index + 1).toISOString(),
  }));

  it("sorts popular events like byPopularity without an eight-event cap", () => {
    const result = applySectionRule(popularInput, "popularCompetitions");
    assert.deepEqual(ids(result), ids([...popularInput].sort(byPopularity)));
    assert.equal(result.length, 12);
  });

  it("sorts recent events like byNewestFirst without an eight-event cap", () => {
    const result = applySectionRule(popularInput, "recentCompetitions");
    assert.deepEqual(ids(result), ids([...popularInput].sort(byNewestFirst)));
    assert.equal(result.length, 12);
    assert.equal(result[0]._id, "p11");
  });

  it("combines quick filters before applying section sorting", () => {
    const events = [
      { _id: "cancelled", eventMode: "Online", status: "cancelled", createdAt: "2026-01-04", entries: [{ price: 25000 }] },
      { _id: "offline", eventMode: "Offline", status: "upcoming", createdAt: "2026-01-03", entries: [{ price: 25000 }] },
      { _id: "online-free", eventMode: "Online", status: "upcoming", createdAt: "2026-01-02", entries: [{ price: 0 }] },
      { _id: "online-paid", eventMode: "Online", status: "upcoming", createdAt: "2026-01-01", entries: [{ price: 25000 }] },
    ];

    const result = applySectionRule(events, "recentCompetitions", {
      quickFilters: ["online", "paid", "upcoming"],
    });

    assert.deepEqual(ids(result), ["online-paid"]);
  });

  it("keeps cancelled and postponed events in the default All results", () => {
    const events = [
      { _id: "cancelled", status: "cancelled" },
      { _id: "postponed", status: "postponed" },
      { _id: "upcoming", status: "upcoming" },
    ];

    assert.deepEqual(ids(applySectionRule(events, "popularCompetitions")), ids(events));
  });

  it("applies Premium to high-entry-fee events and excludes them from Budget Friendly", () => {
    const events = [priced("budget", 50000), priced("premium", 50001)];

    assert.deepEqual(
      ids(applySectionRule(events, "popularCompetitions", { quickFilters: ["premium"] })),
      ["premium"]
    );
    assert.deepEqual(
      ids(applySectionRule(events, "budgetFriendlyCompetitions", { quickFilters: ["premium"] })),
      []
    );
  });

  it("returns an empty result when combined quick filters have no match", () => {
    const events = [
      { _id: "online-paid", eventMode: "Online", status: "upcoming", entries: [{ price: 25000 }] },
      { _id: "offline-free", eventMode: "Offline", status: "upcoming", entries: [{ price: 0 }] },
    ];

    assert.deepEqual(
      applySectionRule(events, "popularCompetitions", { quickFilters: ["online", "free"] }),
      []
    );
  });

  it("sorts nearby events like byNearbyPriority using city and state", () => {
    const events = [
      { _id: "none", location: "Mumbai", viewsCount: 100 },
      { _id: "state", state: "Assam", viewsCount: 1 },
      { _id: "city", city: "Jorhat", state: "Assam", viewsCount: 0 },
      { _id: "fallback", location: "Guwahati", viewsCount: 5 },
    ];
    const result = applySectionRule(events, "nearbyCompetitions", { city: "Jorhat", state: "Assam" });
    assert.deepEqual(ids(result), ids([...events].sort((a, b) => byNearbyPriority(a, b, "Jorhat", "Assam"))));
    assert.equal(result[0]._id, "city");
    assert.equal(result.length, 4);
  });

  it("budget friendly includes exactly 50000 and sorts ascending", () => {
    const events = [priced("a", 50000), priced("b", 100), priced("c", 50001), priced("d", 0)];
    assert.deepEqual(ids(applySectionRule(events, "budgetFriendlyCompetitions")), ["d", "b", "a"]);
  });

  it("high budget excludes exactly 50000 and sorts descending", () => {
    const events = [priced("a", 50000), priced("b", 60000), priced("c", 50001), priced("d", 10)];
    assert.deepEqual(ids(applySectionRule(events, "highBudgetCompetitions")), ["b", "c"]);
  });

  it("drops unpriced and invalid-price events from both budget sections", () => {
    const events = [
      { _id: "none" },
      { _id: "empty", entries: [] },
      priced("blank", " "),
      priced("neg", -5),
      priced("nan", "abc"),
      priced("ok", 100),
    ];
    assert.deepEqual(ids(applySectionRule(events, "budgetFriendlyCompetitions")), ["ok"]);
    assert.deepEqual(ids(applySectionRule(events, "highBudgetCompetitions")), []);
  });

  it("keeps input order for missing or invalid section keys", () => {
    const events = [priced("b", 5), priced("a", 1), priced("c", 9)];
    for (const key of [undefined, null, "", "unknown", "toString"]) {
      assert.deepEqual(ids(applySectionRule(events, key)), ["b", "a", "c"]);
    }
  });

  it("does not mutate the input array", () => {
    const events = [{ _id: "x", viewsCount: 1 }, { _id: "y", viewsCount: 9 }];
    const snapshot = [...events];
    for (const key of ["popularCompetitions", "recentCompetitions", "nearbyCompetitions", "budgetFriendlyCompetitions", "highBudgetCompetitions"]) {
      applySectionRule(events, key, { city: "A", state: "B" });
      assert.deepEqual(events, snapshot);
      assert.equal(events[0], snapshot[0]);
    }
  });
});
