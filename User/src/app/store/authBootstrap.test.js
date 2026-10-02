import test from "node:test";
import assert from "node:assert/strict";

import { shouldBootstrapAuthForPath } from "./authBootstrapLogic.js";

test("user sessions are restored on public pages like home", () => {
  assert.equal(shouldBootstrapAuthForPath("/", "idle"), true);
  assert.equal(shouldBootstrapAuthForPath("/filter", "idle"), true);
  assert.equal(shouldBootstrapAuthForPath("/login", "idle"), false);
  assert.equal(shouldBootstrapAuthForPath("/register", "idle"), false);
  assert.equal(shouldBootstrapAuthForPath("/profile", "idle"), true);
});
