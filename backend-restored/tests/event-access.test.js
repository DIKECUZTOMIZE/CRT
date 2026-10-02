import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import { startAutoCompletionScheduler } from "../server.js";
import EventModel, { deriveEventStatus, shouldAutoCompleteByEndTime } from "../src/model/event.model.js";
import UserModel from "../src/model/user.model.js";
import NotificationModel from "../src/model/notification.model.js";
import {
  getOrganizerEventByIdService,
  updateEventService,
  deleteEventService,
  getPublicEventsService,
  completeEventService,
  createEventService,
  autoCompleteExpiredEvents,
} from "../src/module/event/event.service.js";

test("createEventService derives a past event to completed automatically on creation", async () => {
  const originalCreate = EventModel.create;
  const originalNotifyUsers = NotificationModel.create;

  EventModel.create = async (payload) => ({
    ...payload,
    _id: "event-created-auto-complete",
  });
  NotificationModel.create = async () => ({ ok: true });

  try {
    const result = await createEventService("org-1", {
      title: "Past Event",
      category: "Tech",
      eventDate: "2020-01-01",
      eventStartTime: "09:00 AM",
      eventEndDate: "2020-01-01",
      eventEndTime: "05:00 PM",
      entries: [],
      prizes: [],
      eventRules: [],
      securityRequirements: [],
      participationSteps: [],
      organizerTeam: [],
      customFields: [],
    });

    assert.equal(result.status, "completed");
  } finally {
    EventModel.create = originalCreate;
    NotificationModel.create = originalNotifyUsers;
  }
});

test("updateEventService completes an event on edit when its end time has already passed", async () => {
  const originalFindOne = EventModel.findOne;
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "expired-edit-event",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      eventDate: "2020-01-01",
      eventStartTime: "09:00 AM",
      eventEndDate: "2020-01-01",
      eventEndTime: "09:30 AM",
      title: "Past Edit Check",
    }),
  });

  EventModel.findOneAndUpdate = ({ _id }, update) => ({
    lean: async () => ({
      _id,
      organizerId: "org-1",
      status: update.$set.status,
      completionConfirmedAt: update.$set.completionConfirmedAt,
      title: "Past Edit Check",
    }),
  });

  try {
    const result = await updateEventService("org-1", "expired-edit-event", {
      eventDate: "2020-01-01",
      eventEndDate: "2020-01-01",
      eventStartTime: "09:00 AM",
      eventEndTime: "09:30 AM",
    });

    assert.equal(result.status, "completed");
    assert.ok(result.completionConfirmedAt);
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("autoCompleteExpiredEvents persists completed status and completion timestamp for expired live events", async () => {
  const originalFind = EventModel.find;
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;

  EventModel.find = () => ({
    lean: async () => [
      {
        _id: "expired-live-event",
        organizerId: "org-1",
        status: "live",
        completionConfirmedAt: null,
        eventDate: "2026-09-24",
        eventStartTime: "09:00 AM",
        eventEndDate: "2026-09-24",
        eventEndTime: "09:01 AM",
      },
    ],
  });

  EventModel.findOneAndUpdate = ({ _id }, update) => ({
    lean: async () => ({
      _id,
      status: update.$set.status,
      completionConfirmedAt: update.$set.completionConfirmedAt,
    }),
  });

  try {
    const result = await autoCompleteExpiredEvents();
    assert.equal(result.completed, 1);
    assert.equal(result.updatedEvents[0].status, "completed");
    assert.ok(result.updatedEvents[0].completionConfirmedAt);
  } finally {
    EventModel.find = originalFind;
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("startAutoCompletionScheduler creates one active 30 second sweep", () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  let createdIntervals = 0;

  globalThis.setInterval = (() => {
    createdIntervals += 1;
    return 123456;
  });

  globalThis.clearInterval = (() => undefined);

  try {
    const intervalHandle = startAutoCompletionScheduler({ intervalMs: 30000, runNow: false });
    assert.equal(createdIntervals, 1);
    assert.equal(intervalHandle, 123456);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
});

test("autoCompleteExpiredEvents completes an expired upcoming event", async () => {
  const originalFind = EventModel.find;
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;

  EventModel.find = () => ({
    lean: async () => [{
      _id: "expired-upcoming-event",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      eventDate: "2020-01-01",
      eventStartTime: "09:00 AM",
      eventEndDate: "2020-01-01",
      eventEndTime: "05:00 PM",
    }],
  });

  EventModel.findOneAndUpdate = ({ _id }, update) => ({
    lean: async () => ({
      _id,
      status: update.$set.status,
      completionConfirmedAt: update.$set.completionConfirmedAt,
    }),
  });

  try {
    const result = await autoCompleteExpiredEvents();
    assert.equal(result.completed, 1);
    assert.equal(result.updatedEvents[0].status, "completed");
    assert.ok(result.updatedEvents[0].completionConfirmedAt);
  } finally {
    EventModel.find = originalFind;
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("autoCompleteExpiredEvents preserves second-precision end times before the event actually ends", async () => {
  const originalFind = EventModel.find;
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;

  const now = new Date();
  const end = new Date(now.getTime() + 45 * 1000);
  const endDate = end.toISOString().slice(0, 10);
  const endTime = `${String(end.getHours() % 12 || 12).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}:${String(end.getSeconds()).padStart(2, "0")} ${end.getHours() >= 12 ? "PM" : "AM"}`;

  EventModel.find = () => ({
    lean: async () => [{
      _id: "seconds-precision-upcoming-event",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      eventDate: endDate,
      eventStartTime: "00:00:00 AM",
      eventEndDate: endDate,
      eventEndTime: endTime,
    }],
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => null,
  });

  try {
    const result = await autoCompleteExpiredEvents();
    assert.equal(result.completed, 0);
    assert.deepEqual(result.updatedEvents, []);
  } finally {
    EventModel.find = originalFind;
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("autoCompleteExpiredEvents does not complete a future event", async () => {
  const originalFind = EventModel.find;
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;

  EventModel.find = () => ({
    lean: async () => [{
      _id: "future-event",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      eventDate: "2099-01-01",
      eventStartTime: "09:00 AM",
      eventEndDate: "2099-01-01",
      eventEndTime: "05:00 PM",
    }],
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => null,
  });

  try {
    const result = await autoCompleteExpiredEvents();
    assert.equal(result.completed, 0);
    assert.deepEqual(result.updatedEvents, []);
  } finally {
    EventModel.find = originalFind;
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("autoCompleteExpiredEvents respects a later extended end time", () => {
  const event = {
    status: "upcoming",
    completionConfirmedAt: null,
    eventDate: "2099-01-01",
    eventEndDate: "2099-01-01",
    eventStartTime: "09:00 AM",
    eventEndTime: "05:00 PM",
  };

  const result = shouldAutoCompleteByEndTime(event);
  assert.equal(result, false);
});

test("shouldAutoCompleteByEndTime keeps a future event with second-precision clock time from auto-completing", () => {
  const now = new Date();
  const futureStart = new Date(now.getTime() + 45 * 1000);
  const futureEnd = new Date(now.getTime() + 90 * 1000);

  const event = {
    status: "upcoming",
    completionConfirmedAt: null,
    eventDate: futureStart.toISOString().slice(0, 10),
    eventEndDate: futureEnd.toISOString().slice(0, 10),
    eventStartTime: futureStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
    eventEndTime: futureEnd.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
  };

  assert.equal(shouldAutoCompleteByEndTime(event), false);
});

test("autoCompleteExpiredEvents ignores an already completed event", async () => {
  const originalFind = EventModel.find;

  EventModel.find = () => ({
    lean: async () => [{
      _id: "already-completed-event",
      organizerId: "org-1",
      status: "completed",
      completionConfirmedAt: new Date("2020-01-01T00:00:00.000Z"),
      eventDate: "2020-01-01",
      eventEndDate: "2020-01-01",
      eventEndTime: "05:00 PM",
    }],
  });

  try {
    const result = await autoCompleteExpiredEvents();
    assert.equal(result.completed, 0);
    assert.deepEqual(result.updatedEvents, []);
  } finally {
    EventModel.find = originalFind;
  }
});

test("autoCompleteExpiredEvents protects a completionConfirmedAt timestamp", () => {
  const result = shouldAutoCompleteByEndTime({
    status: "upcoming",
    completionConfirmedAt: new Date("2020-01-01T00:00:00.000Z"),
    eventDate: "2020-01-01",
    eventStartTime: "09:00 AM",
    eventEndDate: "2020-01-01",
    eventEndTime: "05:00 PM",
  });

  assert.equal(result, false);
});

test("startAutoCompletionScheduler continues after a failed sweep", async () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const originalFind = EventModel.find;
  let callback = null;

  const freshServerModule = await import(new URL(`../server.js?bust=${Date.now()}`, import.meta.url).href);
  const { startAutoCompletionScheduler: freshStartAutoCompletionScheduler } = freshServerModule;

  globalThis.setInterval = ((fn) => {
    callback = fn;
    return 123456;
  });

  globalThis.clearInterval = (() => undefined);
  EventModel.find = () => ({
    lean: async () => {
      throw new Error("forced sweep failure");
    },
  });

  try {
    const intervalHandle = freshStartAutoCompletionScheduler({ intervalMs: 30000, runNow: false });
    assert.equal(intervalHandle, 123456);
    assert.equal(typeof callback, "function");
    await assert.doesNotReject(async () => callback());
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
    EventModel.find = originalFind;
  }
});

test("deriveEventStatus moves a past event with no explicit status to completed automatically", () => {
  const result = deriveEventStatus({
    eventDate: "2000-01-01",
    eventStartTime: "09:00 AM",
    eventEndDate: "2000-01-01",
    eventEndTime: "05:00 PM",
  });

  assert.equal(result, "completed");
});

test("manual live status override persists for a future-dated event", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-future-live",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      results: [],
      eventDate: "2026-11-20",
      eventEndDate: "2026-11-21",
      eventStartTime: "09:30 AM",
      eventEndTime: "05:30 PM",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "event-future-live",
      organizerId: "org-1",
      status: "live",
    }),
  });

  try {
    const result = await updateEventService("org-1", "event-future-live", { status: "live" }, "ORGANIZER");
    assert.equal(result.status, "live");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("manual ended status override persists for a future-dated event", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-future-ended",
      organizerId: "org-1",
      status: "upcoming",
      completionConfirmedAt: null,
      results: [],
      eventDate: "2026-11-20",
      eventEndDate: "2026-11-21",
      eventStartTime: "09:30 AM",
      eventEndTime: "05:30 PM",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "event-future-ended",
      organizerId: "org-1",
      status: "ended",
    }),
  });

  try {
    const result = await updateEventService("org-1", "event-future-ended", { status: "ended" }, "ORGANIZER");
    assert.equal(result.status, "ended");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("final completed event remains locked against normal status edits", async () => {
  const originalFindOne = EventModel.findOne;

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-locked",
      organizerId: "org-1",
      status: "completed",
      completionConfirmedAt: new Date("2026-09-21T00:00:00.000Z"),
      results: [],
    }),
  });

  try {
    await assert.rejects(
      () => updateEventService("org-1", "event-locked", { status: "upcoming" }, "ORGANIZER"),
      /already completed and cannot be edited or changed/
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("results remain blocked before final completion", async () => {
  const originalFindOne = EventModel.findOne;

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-results-blocked",
      organizerId: "org-1",
      status: "live",
      completionConfirmedAt: null,
      results: [],
    }),
  });

  try {
    await assert.rejects(
      () => updateEventService("org-1", "event-results-blocked", {
        results: [{ participation: "Solo", position: "1st", name: "Ava" }],
      }, "ORGANIZER"),
      /Results can only be saved after the event is finally completed/
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("admin can fetch an event without organizer ownership filter", async () => {
  const originalFindOne = EventModel.findOne;
  let capturedQuery = null;

  EventModel.findOne = () => ({
    lean: async () => {
      const result = { _id: "event-123", title: "Admin Test Event" };
      capturedQuery = { _id: "event-123" };
      return result;
    },
  });

  try {
    const result = await getOrganizerEventByIdService("organizer-1", "event-123", "ADMIN");
    assert.deepEqual(capturedQuery, { _id: "event-123" });
    assert.equal(result.title, "Admin Test Event");
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("admin can update an event without organizer ownership filter", async () => {
  const originalUpdate = EventModel.findOneAndUpdate;
  let capturedQuery = null;

  EventModel.findOneAndUpdate = () => ({
    lean: async () => {
      const result = { _id: "event-123", status: "live" };
      capturedQuery = { _id: "event-123" };
      return result;
    },
  });

  try {
    const result = await updateEventService("organizer-1", "event-123", { status: "live" }, "ADMIN");
    assert.deepEqual(capturedQuery, { _id: "event-123" });
    assert.equal(result.status, "live");
  } finally {
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("admin can delete an event without organizer ownership filter", async () => {
  const originalDelete = EventModel.findOneAndDelete;
  let capturedQuery = null;

  EventModel.findOneAndDelete = () => ({
    lean: async () => {
      const result = { _id: "event-123", title: "Delete Me" };
      capturedQuery = { _id: "event-123" };
      return result;
    },
  });

  try {
    const result = await deleteEventService("organizer-1", "event-123", "ADMIN");
    assert.deepEqual(capturedQuery, { _id: "event-123" });
    assert.equal(result.title, "Delete Me");
  } finally {
    EventModel.findOneAndDelete = originalDelete;
  }
});

test("create event service creates a user notification for the new event", async () => {
  const originalCreate = EventModel.create;
  const originalUserFind = UserModel.find;
  const originalNotificationCreate = NotificationModel.create;
  const previousReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");

  Object.defineProperty(mongoose.connection, "readyState", {
    value: 1,
    configurable: true,
    writable: true,
  });

  EventModel.create = async (payload) => ({
    ...payload,
    _id: "evt-new-1",
    toObject: () => ({ ...payload, _id: "evt-new-1" }),
  });

  UserModel.find = () => ({
    select: () => ({
      lean: async () => [{ _id: "user-1" }, { _id: "user-2" }],
    }),
  });

  let createdNotifications = [];
  NotificationModel.create = async (payload) => {
    createdNotifications.push(payload);
    return {
      ...payload,
      _id: `notif-${createdNotifications.length}`,
      toObject: () => ({ ...payload, _id: `notif-${createdNotifications.length}` }),
    };
  };

  try {
    const result = await createEventService("org-1", {
      title: "New Event Alert",
      city: "Guwahati",
      state: "Assam",
      location: "Campus A",
      category: "Hackathon",
      eventMode: "Offline",
      status: "upcoming",
      eventDate: "2026-10-15",
      eventStartTime: "09:30 AM",
      eventEndDate: "2026-10-16",
      eventEndTime: "05:30 PM",
      totalSeats: 100,
      participation: { enabled: false },
      entries: [],
      prizes: [],
      eventRules: [],
      securityRequirements: [],
      participationSteps: [],
      customFields: [],
      organizerTeam: [],
    });

    assert.equal(result.title, "New Event Alert");
    assert.equal(createdNotifications.length, 2);
    assert.ok(createdNotifications.every((item) => item.title === "New event is live"));
    assert.ok(createdNotifications.every((item) => String(item.userId) === "user-1" || String(item.userId) === "user-2"));
  } finally {
    EventModel.create = originalCreate;
    UserModel.find = originalUserFind;
    NotificationModel.create = originalNotificationCreate;

    if (previousReadyState) {
      Object.defineProperty(mongoose.connection, "readyState", previousReadyState);
    } else {
      delete mongoose.connection.readyState;
    }
  }
});

test("create event service includes users stored through roles arrays in notification fan-out", async () => {
  const originalCreate = EventModel.create;
  const originalUserFind = UserModel.find;
  const originalNotificationCreate = NotificationModel.create;
  const previousReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");

  Object.defineProperty(mongoose.connection, "readyState", {
    value: 1,
    configurable: true,
    writable: true,
  });

  EventModel.create = async (payload) => ({
    ...payload,
    _id: "evt-roles-1",
    toObject: () => ({ ...payload, _id: "evt-roles-1" }),
  });

  let capturedFilter = null;
  UserModel.find = (filter) => {
    capturedFilter = filter;
    return {
      select: () => ({
        lean: async () => [{ _id: "user-array-1" }, { _id: "user-array-2" }],
      }),
    };
  };

  NotificationModel.create = async (payload) => ({
    ...payload,
    _id: `notif-${payload.userId}`,
    toObject: () => ({ ...payload, _id: `notif-${payload.userId}` }),
  });

  try {
    await createEventService("org-1", {
      title: "Array Role Event",
      city: "Silchar",
      state: "Assam",
      location: "Campus B",
      category: "Cultural",
      eventMode: "Offline",
      status: "upcoming",
      eventDate: "2026-11-12",
      eventStartTime: "10:00 AM",
      eventEndDate: "2026-11-12",
      eventEndTime: "02:00 PM",
      totalSeats: 80,
      participation: { enabled: false },
      entries: [],
      prizes: [],
      eventRules: [],
      securityRequirements: [],
      participationSteps: [],
      customFields: [],
      organizerTeam: [],
    });

    assert.ok(capturedFilter && capturedFilter.$and);
    const roleClause = capturedFilter.$and.find((entry) => entry && entry.$or);
    assert.ok(roleClause && roleClause.$or);
    assert.ok(roleClause.$or.some((entry) => entry.role && entry.role === "USER"));
    assert.ok(roleClause.$or.some((entry) => entry.roles && entry.roles === "USER"));
  } finally {
    EventModel.create = originalCreate;
    UserModel.find = originalUserFind;
    NotificationModel.create = originalNotificationCreate;

    if (previousReadyState) {
      Object.defineProperty(mongoose.connection, "readyState", previousReadyState);
    } else {
      delete mongoose.connection.readyState;
    }
  }
});

test("organizer can cancel an event with a status alias", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "upcoming",
      eventEndDate: "2099-12-31",
      eventEndTime: "18:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", status: "cancelled" }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", { status: "cancel" }, "ORGANIZER");
    assert.equal(result.status, "cancelled");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("admin can postpone an event with a status alias", async () => {
  const originalUpdate = EventModel.findOneAndUpdate;
  let capturedPayload = null;

  EventModel.findOneAndUpdate = (_, update) => ({
    lean: async () => {
      capturedPayload = update.$set.status;
      return { _id: "event-123", status: "postponed" };
    },
  });

  try {
    const result = await updateEventService("organizer-1", "event-123", { status: "postpond" }, "ADMIN");
    assert.equal(capturedPayload, "postponed");
    assert.equal(result.status, "postponed");
  } finally {
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("public events service filters by participation type", async () => {
  const originalAggregate = EventModel.aggregate;
  const capturedPipelines = [];

  EventModel.aggregate = async (pipeline) => {
    capturedPipelines.push(pipeline);

    if (pipeline.some((stage) => stage && stage.$count)) {
      return [{ total: 1 }];
    }

    return [{ _id: "event-123", title: "Solo Event" }];
  };

  try {
    const result = await getPublicEventsService({ participationType: "solo" }, { page: 1, limit: 10 });
    const matchStage = capturedPipelines[1]?.find((stage) => stage && stage.$match);
    const match = matchStage?.$match || {};

    assert.equal(result.total, 1);
    assert.equal(result.events[0].title, "Solo Event");
    assert.ok(
      JSON.stringify(match).toLowerCase().includes("solo") ||
      JSON.stringify(match).toLowerCase().includes("team")
    );
  } finally {
    EventModel.aggregate = originalAggregate;
  }
});

test("public events service keeps participation filtering exact and canonical", async () => {
  const originalAggregate = EventModel.aggregate;
  let capturedMatch = null;

  EventModel.aggregate = async (pipeline) => {
    const matchStage = pipeline.find((stage) => stage && stage.$match);
    capturedMatch = matchStage?.$match || {};

    if (pipeline.some((stage) => stage && stage.$count)) {
      return [{ total: 1 }];
    }

    return [{ _id: "event-123", title: "Solo Event" }];
  };

  try {
    const result = await getPublicEventsService({ participationType: "solo" }, { page: 1, limit: 10 });

    assert.equal(result.total, 1);
    assert.ok(JSON.stringify(capturedMatch).toLowerCase().includes("solo"));
    assert.doesNotMatch(JSON.stringify(capturedMatch).toLowerCase(), /individual|single|duo|crew/);
  } finally {
    EventModel.aggregate = originalAggregate;
  }
});

test("organizer can edit an event before the end date/time", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      title: "Old title",
      status: "upcoming",
      eventEndDate: "2099-12-31",
      eventEndTime: "18:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", title: "New title", status: "upcoming" }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", { title: "New title" }, "ORGANIZER");
    assert.equal(result.title, "New title");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("organizer status change still works before the end date/time", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "upcoming",
      eventEndDate: "2099-12-31",
      eventEndTime: "18:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", status: "live" }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", { status: "live" }, "ORGANIZER");
    assert.equal(result.status, "live");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("ended event stays manageable until final completion", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "ended",
      eventEndDate: "2000-01-01",
      eventEndTime: "08:00",
      results: [],
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", status: "live" }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", { status: "live" }, "ORGANIZER");
    assert.equal(result.status, "live");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("organizer manual completion is forbidden even for a finished event", async () => {
  const originalFindOne = EventModel.findOne;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "upcoming",
      eventEndDate: "2000-01-01",
      eventEndTime: "08:00",
    }),
  });

  try {
    await assert.rejects(
      () => updateEventService(organizerId, "event-123", { status: "completed" }, "ORGANIZER"),
      /forbidden|organizer/i
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("organizer manual completion is forbidden before the scheduled end time", async () => {
  const originalFindOne = EventModel.findOne;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "upcoming",
      eventEndDate: "2099-12-31",
      eventEndTime: "18:00",
    }),
  });

  try {
    await assert.rejects(
      () => updateEventService(organizerId, "event-123", { status: "completed" }, "ORGANIZER"),
      /forbidden|organizer/i
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("organizer can complete their own event through the final completion flow", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = ({ _id, organizerId: eventOrganizerId }) => ({
    lean: async () => {
      if (_id === "event-123" && eventOrganizerId === organizerId) {
        return {
          _id: "event-123",
          organizerId,
          status: "live",
          eventEndDate: "2099-12-31",
          eventEndTime: "18:00",
          results: [],
        };
      }

      return null;
    },
  });

  EventModel.findOneAndUpdate = (query, update) => ({
    lean: async () => ({
      _id: query._id,
      organizerId,
      status: "completed",
      completionConfirmedAt: update.$set.completionConfirmedAt,
    }),
  });

  try {
    const result = await completeEventService(organizerId, "event-123", "ORGANIZER");

    assert.equal(result.status, "completed");
    assert.ok(result.completionConfirmedAt);
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("already completed events reject further edits and status changes", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "completed",
      eventEndDate: "2024-01-01",
      eventEndTime: "08:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", status: "completed" }),
  });

  try {
    await assert.rejects(
      () => updateEventService(organizerId, "event-123", { title: "Updated" }, "ORGANIZER"),
      /completed|locked/i
    );

    await assert.rejects(
      () => updateEventService(organizerId, "event-123", { status: "live" }, "ORGANIZER"),
      /completed|locked/i
    );
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("custom result entries support multiple rows while preserving legacy fields", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "completed",
      eventEndDate: "2000-01-01",
      eventEndTime: "08:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "event-123",
      status: "completed",
      results: [
        { participation: "Solo", participationType: "Solo", position: "1st", name: "Rahul", winnerName: "Rahul" },
        { participation: "Group", participationType: "Group", position: "2nd", name: "Team Alpha", winnerName: "Team Alpha" },
      ],
    }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", {
      results: [
        { participation: "Solo", position: "1st", name: "Rahul" },
        { participation: "Group", position: "2nd", name: "Team Alpha" },
      ],
    }, "ORGANIZER");

    assert.equal(result.results.length, 2);
    assert.equal(result.results[0].participation, "Solo");
    assert.equal(result.results[0].name, "Rahul");
    assert.equal(result.results[0].participationType, "Solo");
    assert.equal(result.results[0].winnerName, "Rahul");
    assert.equal(result.results[1].participation, "Group");
    assert.equal(result.results[1].name, "Team Alpha");
    assert.equal(result.results[1].position, "2nd");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("result updates are allowed only after completion", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "upcoming",
      eventEndDate: "2000-01-01",
      eventEndTime: "08:00",
    }),
  });

  try {
    await assert.rejects(
      () => updateEventService(organizerId, "event-123", {
        results: [{ participationType: "Solo", position: "1st", winnerName: "Aman" }],
      }, "ORGANIZER"),
      /completed/i
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }

  EventModel.findOne = () => ({
    lean: async () => ({
      _id: "event-123",
      organizerId,
      status: "completed",
      eventEndDate: "2000-01-01",
      eventEndTime: "08:00",
    }),
  });

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "event-123",
      status: "completed",
      results: [{ participationType: "Solo", position: "1st", winnerName: "Aman" }],
    }),
  });

  try {
    const result = await updateEventService(organizerId, "event-123", {
      results: [{ participationType: "Solo", position: "1st", winnerName: "Aman" }],
    }, "ORGANIZER");

    assert.equal(result.results[0].winnerName, "Aman");
    assert.equal(result.results[0].position, "1st");
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("organizer complete is rejected once the event is already completed", async () => {
  const originalFindOne = EventModel.findOne;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = ({ _id, organizerId: eventOrganizerId }) => ({
    lean: async () => {
      if (_id === "event-123" && eventOrganizerId === organizerId) {
        return {
          _id: "event-123",
          organizerId,
          status: "completed",
          eventEndDate: "2000-01-01",
          eventEndTime: "08:00",
        };
      }

      return null;
    },
  });

  try {
    await assert.rejects(
      () => completeEventService(organizerId, "event-123", "ORGANIZER"),
      /already completed|final completion|completed/i
    );
  } finally {
    EventModel.findOne = originalFindOne;
  }
});

test("admin completion persists completionConfirmedAt timestamp on final completion", async () => {
  const originalFindOne = EventModel.findOne;
  const originalUpdate = EventModel.findOneAndUpdate;
  const adminId = "admin-123";
  let capturedUpdate = null;

  EventModel.findOne = ({ _id, organizerId }) => ({
    lean: async () => {
      if (_id === "event-123" && organizerId === undefined) {
        return {
          _id: "event-123",
          organizerId: "organizer-456",
          status: "upcoming",
          results: [],
        };
      }

      return null;
    },
  });

  EventModel.findOneAndUpdate = (query, update) => {
    capturedUpdate = update;
    return {
      lean: async () => ({
        _id: "event-123",
        status: "completed",
        completionConfirmedAt: update.$set.completionConfirmedAt,
      }),
    };
  };

  try {
    const completed = await completeEventService(adminId, "event-123", "ADMIN");

    assert.equal(capturedUpdate.$set.status, "completed");
    assert.ok(capturedUpdate.$set.completionConfirmedAt);
    assert.equal(completed.status, "completed");
    assert.ok(completed.completionConfirmedAt);
  } finally {
    EventModel.findOne = originalFindOne;
    EventModel.findOneAndUpdate = originalUpdate;
  }
});

test("organizer a cannot edit organizer b event", async () => {
  const originalFindOne = EventModel.findOne;
  const organizerId = "507f1f77bcf86cd799439011";

  EventModel.findOne = () => ({
    lean: async () => null,
  });

  try {
    const result = await updateEventService(organizerId, "event-123", { title: "Hacked" }, "ORGANIZER");
    assert.equal(result, null);
  } finally {
    EventModel.findOne = originalFindOne;
  }
});
