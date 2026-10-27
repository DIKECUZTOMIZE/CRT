import assert from "node:assert/strict";
import test from "node:test";

import EventModel from "../src/model/event.model.js";
import { getPublicEventsService } from "../src/module/event/event.service.js";

test("public event listings expose entry prices for Home budget sections", async () => {
  const originalAggregate = EventModel.aggregate;
  const prices = [{ price: 0 }, { price: 50000 }, { price: 50001 }];
  let projectedFields;

  EventModel.aggregate = async (pipeline) => {
    const eventsProjection = pipeline.find((stage) => stage.$facet)?.$facet.events
      .find((stage) => stage.$project)?.$project;
    projectedFields = eventsProjection;

    return [{
      total: [{ count: 1 }],
      events: [{ _id: "budget-event", entries: prices }],
    }];
  };

  try {
    const result = await getPublicEventsService(
      { search: "home-budget-projection-test" },
      { page: 1, limit: 8 },
    );

    assert.equal(projectedFields["entries.price"], 1);
    assert.deepEqual(result.events[0].entries, prices);
  } finally {
    EventModel.aggregate = originalAggregate;
  }
});

test("public event listings include cancelled and postponed events in default and filtered queries", async () => {
  const originalFind = EventModel.find;
  const originalCountDocuments = EventModel.countDocuments;
  const originalAggregate = EventModel.aggregate;
  const statuses = ["upcoming", "live", "cancelled", "postponed"];
  const events = statuses.map((status) => ({ _id: `event-${status}`, status }));
  const expectedStatuses = { $in: statuses };
  let defaultFindMatch;
  let defaultCountMatch;
  let filteredMatch;

  EventModel.find = (match) => {
    defaultFindMatch = match;
    return {
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => events,
            }),
          }),
        }),
      }),
    };
  };
  EventModel.countDocuments = async (match) => {
    defaultCountMatch = match;
    return events.length;
  };
  EventModel.aggregate = async (pipeline) => {
    filteredMatch = pipeline.find((stage) => stage.$match)?.$match;
    return [{
      total: [{ count: events.length }],
      events,
    }];
  };

  try {
    const defaultResult = await getPublicEventsService({}, { page: 1, limit: 12 });
    const filteredResult = await getPublicEventsService(
      { search: "home-status-eligibility-regression" },
      { page: 1, limit: 8 },
    );

    assert.deepEqual(defaultFindMatch.status, expectedStatuses);
    assert.deepEqual(defaultCountMatch.status, expectedStatuses);
    assert.deepEqual(filteredMatch.status, expectedStatuses);
    assert.deepEqual(defaultResult.events.map((event) => event.status), statuses);
    assert.deepEqual(filteredResult.events.map((event) => event.status), statuses);
    assert.deepEqual(
      [defaultResult.total, defaultResult.page, defaultResult.limit, defaultResult.totalPages],
      [events.length, 1, 12, 1],
    );
    assert.deepEqual(
      [filteredResult.total, filteredResult.page, filteredResult.limit, filteredResult.totalPages],
      [events.length, 1, 8, 1],
    );
  } finally {
    EventModel.find = originalFind;
    EventModel.countDocuments = originalCountDocuments;
    EventModel.aggregate = originalAggregate;
  }
});
