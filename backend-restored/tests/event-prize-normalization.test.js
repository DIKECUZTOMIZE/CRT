import assert from "node:assert/strict";
import test from "node:test";

import EventModel from "../src/model/event.model.js";
import { createEventService, updateEventService } from "../src/module/event/event.service.js";
import { createEventSchema, updateEventSchema } from "../src/schema/event.schema.js";

const amountCases = [
    { name: "missing amount", prize: { category: "General" }, retained: false },
    { name: "empty amount", prize: { category: "General", amount: "" }, retained: false },
    { name: "whitespace amount", prize: { category: "General", amount: "   " }, retained: false },
    { name: "invalid amount", prize: { category: "General", amount: "invalid" }, retained: false },
    { name: "numeric zero", prize: { category: "General", amount: 0 }, retained: true, amount: 0 },
    { name: "string zero", prize: { category: "General", amount: "0" }, retained: true, amount: 0 },
    { name: "positive amount", prize: { category: "General", amount: "1250" }, retained: true, amount: 1250 },
    { name: "reward only", prize: { category: "General", reward: "Certificate" }, retained: true, reward: "Certificate" },
];

const createPayload = (prizes) => ({
    title: "Prize Normalization Test",
    category: "Workshop",
    eventMode: "Offline",
    seatAvailability: "Available",
    prizes,
});

const assertNormalizedPrizeCases = (prizes) => {
    assert.equal(prizes.length, amountCases.filter((item) => item.retained).length);

    amountCases
        .filter((item) => item.retained)
        .forEach((item, index) => {
            assert.equal(prizes[index].category, item.prize.category);
            if ("amount" in item) {
                assert.equal(prizes[index].amount, item.amount, item.name);
            } else {
                assert.equal("amount" in prizes[index], false, item.name);
            }
            if ("reward" in item) {
                assert.equal(prizes[index].reward, item.reward, item.name);
            }
        });
};

test("create drops missing, empty, whitespace, and invalid amounts while preserving supported prizes", async () => {
    const originalCreate = EventModel.create;
    let createdEvent;
    EventModel.create = async (payload) => {
        createdEvent = payload;
        return payload;
    };

    try {
        await createEventService(
            "organizer-1",
            createPayload(amountCases.map(({ prize }) => prize))
        );
        assertNormalizedPrizeCases(createdEvent.prizes);
    } finally {
        EventModel.create = originalCreate;
    }
});

test("update drops missing, empty, whitespace, and invalid amounts while preserving supported prizes", async () => {
    const originalFindOneAndUpdate = EventModel.findOneAndUpdate;
    let updatedPayload;
    EventModel.findOneAndUpdate = (_filter, update) => {
        updatedPayload = update.$set;
        return { lean: async () => updatedPayload };
    };

    try {
        await updateEventService(
            "organizer-1",
            "event-1",
            { prizes: amountCases.map(({ prize }) => prize) },
            "ADMIN"
        );
        assertNormalizedPrizeCases(updatedPayload.prizes);
    } finally {
        EventModel.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test("create and update prize schemas treat whitespace amounts as missing without coercing shared optional numbers", () => {
    const createResult = createEventSchema.safeParse({
        body: {
            ...createPayload([{ category: "General", amount: "   " }]),
            totalPrizePool: "   ",
        },
    });
    const updateResult = updateEventSchema.safeParse({
        params: { id: "event-1" },
        body: {
            prizes: [{ category: "General", amount: "   " }],
            totalPrizePool: "   ",
        },
    });

    assert.equal(createResult.success, true);
    assert.equal(createResult.data.body.prizes[0].amount, undefined);
    assert.equal(createResult.data.body.totalPrizePool, 0);
    assert.equal(updateResult.success, true);
    assert.equal(updateResult.data.body.prizes[0].amount, undefined);
    assert.equal(updateResult.data.body.totalPrizePool, 0);
});
