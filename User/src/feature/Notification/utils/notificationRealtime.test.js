import test from "node:test";
import assert from "node:assert/strict";

import { subscribeToNotificationRealtime } from "./notificationRealtime.js";

const createHarness = (connected) => {
  const handlers = { connect: new Set(), notifications: new Set() };
  const calls = { join: 0 };
  const socket = {
    connected,
    on: (name, fn) => handlers[name]?.add(fn),
    off: (name, fn) => handlers[name]?.delete(fn),
  };
  const deps = {
    socket,
    joinUserRoom: () => { calls.join += 1; },
    listenToNotifications: (cb) => {
      handlers.notifications.add(cb);
      return () => handlers.notifications.delete(cb);
    },
  };
  return { handlers, calls, deps };
};

test("joins immediately when already connected and refetches on notifications:updated", () => {
  const { handlers, calls, deps } = createHarness(true);
  let updates = 0;
  subscribeToNotificationRealtime({ ...deps, onUpdate: () => { updates += 1; } });

  assert.equal(calls.join, 1);
  handlers.notifications.forEach((cb) => cb({ type: "created" }));
  assert.equal(updates, 1);
});

test("joins the user room on late connect and on every reconnect", () => {
  const { handlers, calls, deps } = createHarness(false);
  subscribeToNotificationRealtime({ ...deps, onUpdate: () => {} });

  assert.equal(calls.join, 0);
  handlers.connect.forEach((fn) => fn());
  handlers.connect.forEach((fn) => fn());
  assert.equal(calls.join, 2);
});

test("cleanup removes every handler so remount or user change leaves no duplicates", () => {
  const { handlers, deps } = createHarness(true);
  let updates = 0;
  const onUpdate = () => { updates += 1; };

  const stopFirst = subscribeToNotificationRealtime({ ...deps, onUpdate });
  stopFirst();
  assert.equal(handlers.connect.size, 0);
  assert.equal(handlers.notifications.size, 0);

  const stopSecond = subscribeToNotificationRealtime({ ...deps, onUpdate });
  assert.equal(handlers.connect.size, 1);
  assert.equal(handlers.notifications.size, 1);
  handlers.notifications.forEach((cb) => cb({ type: "read" }));
  assert.equal(updates, 1);

  stopSecond();
  assert.equal(handlers.connect.size, 0);
  assert.equal(handlers.notifications.size, 0);
});
