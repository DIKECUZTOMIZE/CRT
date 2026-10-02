import test from "node:test";
import assert from "node:assert/strict";

import { dedupeHomeSections } from "../utils/homeSectionUtils.js";

test("deduplicates the same event across multiple home sections", () => {
  const sections = {
    popularCompetitions: [{ id: "a", title: "Alpha" }, { id: "b", title: "Bravo" }],
    recentCompetitions: [{ id: "b", title: "Bravo" }, { id: "c", title: "Charlie" }],
    nearbyCompetitions: [{ id: "c", title: "Charlie" }, { id: "d", title: "Delta" }],
  };

  const result = dedupeHomeSections(sections);

  assert.deepEqual(result.popularCompetitions.map((event) => event.id), ["a", "b"]);
  assert.deepEqual(result.recentCompetitions.map((event) => event.id), ["c"]);
  assert.deepEqual(result.nearbyCompetitions.map((event) => event.id), ["d"]);
});
