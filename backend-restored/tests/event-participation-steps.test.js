import test from "node:test";
import assert from "node:assert/strict";

import EventModel from "../src/model/event.model.js";
import { createEventSchema, updateEventSchema } from "../src/schema/event.schema.js";
import { createEventService, updateEventService } from "../src/module/event/event.service.js";

const step = {
  title: "Submit your proposal",
  text: "Upload the proposal before the deadline.",
};

test("participation step title and text pass create validation and service normalization", async () => {
  const originalCreate = EventModel.create;
  let createdEvent;

  EventModel.create = async (payload) => {
    createdEvent = payload;
    return payload;
  };

  try {
    const { body } = createEventSchema.parse({
      body: {
        title: "Participation Steps Test",
        category: "Workshop",
        eventMode: "Offline",
        seatAvailability: "Available",
        status: "upcoming",
        participationSteps: [step],
      },
    });

    await createEventService("organizer-1", body);
    assert.deepEqual(createdEvent.participationSteps, [step]);
  } finally {
    EventModel.create = originalCreate;
  }
});

test("participation step title and text pass update validation and service", async () => {
  const originalFindOneAndUpdate = EventModel.findOneAndUpdate;
  let updatedPayload;

  EventModel.findOneAndUpdate = (_filter, update) => {
    updatedPayload = update.$set;
    return { lean: async () => updatedPayload };
  };

  try {
    const { body, params } = updateEventSchema.parse({
      params: { id: "event-1" },
      body: { participationSteps: [step] },
    });

    await updateEventService("organizer-1", params.id, body, "ADMIN");
    assert.deepEqual(updatedPayload.participationSteps, [step]);
  } finally {
    EventModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("participation step model accepts optional title and existing text", () => {
  const event = new EventModel({ participationSteps: [step] });
  assert.equal(event.participationSteps[0].title, step.title);
  assert.equal(event.participationSteps[0].text, step.text);

  const legacyEvent = new EventModel({
    participationSteps: [{ text: "Complete the existing instructions." }],
  });
  assert.equal(legacyEvent.participationSteps[0].title, undefined);
  assert.equal(legacyEvent.participationSteps[0].text, "Complete the existing instructions.");
});
