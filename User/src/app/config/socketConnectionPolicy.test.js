import test from "node:test";
import assert from "node:assert/strict";

import { resolveSocketConnectionAction } from "./socketConnectionPolicy.js";

test("connects an authenticated user even though the auth cookie is httpOnly", () => {
  assert.equal(resolveSocketConnectionAction({ userId: "u1", socketActive: false, socketUserId: null }), "connect");
});

test("does not reconnect when the socket is already active for the same user", () => {
  assert.equal(resolveSocketConnectionAction({ userId: "u1", socketActive: true, socketUserId: "u1" }), "none");
});

test("reconnects when a different user is authenticated on an active socket", () => {
  assert.equal(resolveSocketConnectionAction({ userId: "u2", socketActive: true, socketUserId: "u1" }), "reconnect");
});

test("never connects without an authenticated user", () => {
  assert.equal(resolveSocketConnectionAction({ userId: "", socketActive: false, socketUserId: null }), "none");
  assert.equal(resolveSocketConnectionAction({ userId: undefined, socketActive: true, socketUserId: "u1" }), "none");
});
