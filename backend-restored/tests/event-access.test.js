import assert from "node:assert/strict";
import test from "node:test";

import EventModel from "../src/model/event.model.js";
import {
  getOrganizerEventByIdService,
  updateEventService,
  deleteEventService,
  getPublicEventsService,
} from "../src/module/event/event.service.js";

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

test("organizer can cancel an event with a status alias", async () => {
  const originalUpdate = EventModel.findOneAndUpdate;

  EventModel.findOneAndUpdate = () => ({
    lean: async () => ({ _id: "event-123", status: "cancelled" }),
  });

  try {
    const result = await updateEventService("organizer-1", "event-123", { status: "cancel" }, "ORGANIZER");
    assert.equal(result.status, "cancelled");
  } finally {
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
