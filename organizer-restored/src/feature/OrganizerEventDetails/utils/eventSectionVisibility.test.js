import assert from "node:assert/strict";
import test from "node:test";

import {
  getEventStatusSectionVisibility,
  getOptionalEventSectionVisibility,
} from "./eventSectionVisibility.js";

test("hides optional sections for empty data and form placeholders", () => {
  assert.deepEqual(
    getOptionalEventSectionVisibility({
      entries: [{
        category: "General / All",
        participationType: "Solo",
        isPaid: "No",
        price: 0,
      }],
      entryFee: {},
      prizes: [{ category: "General", position: "General", amount: 0 }],
      totalPrizePool: 0,
      participationSteps: [{ title: "", text: "" }],
      eventRules: [{ type: "General", text: "" }],
      securityRequirements: [{ type: "Other", text: "" }],
      organizerTeam: [{ name: "", role: "" }],
      organizerContact: { name: "Official Organizer", whatsapp: "" },
      rules: [{ text: "N/A" }],
    }),
    {
      entry: false,
      prizes: false,
      howToJoin: false,
      rules: false,
      security: false,
      organizerTeam: false,
      contact: false,
    },
  );
});

test("shows optional sections when their raw payload has meaningful data", () => {
  assert.deepEqual(
    getOptionalEventSectionVisibility({
      entries: [{ category: "Student", participationType: "Solo", price: 0 }],
      prizes: [{ category: "General", position: "1st", amount: 100 }],
      participationSteps: [{ title: "Register", text: "Complete registration." }],
      eventRules: [{ type: "General", text: "Follow the code of conduct." }],
      securityRequirements: [{ type: "Other", text: "Bring photo ID." }],
      organizerTeam: [{ name: "Event Lead", role: "Organizer Team" }],
      organizerContact: { name: "Event Office", whatsapp: "+911234567890" },
    }),
    {
      entry: true,
      prizes: true,
      howToJoin: true,
      rules: true,
      security: true,
      organizerTeam: true,
      contact: true,
    },
  );
});

test("shows all seven optional sections for the saved event payload shape", () => {
  const rawEvent = {
    status: "upcoming",
    entries: [
      { category: "Student", participationType: "Solo", isPaid: "Yes", price: 100 },
      { category: "VIP / Premium Pass", participationType: "Team", isPaid: "Yes", price: 250 },
    ],
    prizes: Array.from({ length: 6 }, (_, index) => ({
      category: index < 3 ? "Solo" : "Team",
      position: `${(index % 3) + 1}${["st", "nd", "rd"][index % 3]}`,
      amount: (index + 1) * 100,
      reward: `Prize ${index + 1}`,
    })),
    participationSteps: [{ title: "Register", text: "Complete registration." }],
    eventRules: [{ type: "Conduct", text: "Follow the code of conduct." }],
    securityRequirements: [{ type: "Safety", text: "Follow venue safety instructions." }],
    organizerTeam: [
      { name: "Event Lead", role: "Lead Coordinator" },
      { name: "Registration Lead", role: "Registration" },
      { name: "Venue Lead", role: "Venue Coordinator" },
    ],
    organizerContact: { name: "Event Office", whatsapp: "+911234567890" },
  };

  assert.deepEqual(
    [
      rawEvent.entries.length,
      rawEvent.prizes.length,
      rawEvent.participationSteps.length,
      rawEvent.eventRules.length,
      rawEvent.securityRequirements.length,
      rawEvent.organizerTeam.length,
    ],
    [2, 6, 1, 1, 1, 3],
  );
  assert.deepEqual(getOptionalEventSectionVisibility(rawEvent), {
    entry: true,
    prizes: true,
    howToJoin: true,
    rules: true,
    security: true,
    organizerTeam: true,
    contact: true,
  });
  assert.deepEqual(getEventStatusSectionVisibility(rawEvent.status), {
    postponed: false,
    cancelled: false,
  });
});

test("shows each optional section only for its own supported raw data", () => {
  const sectionCases = [
    ["entry", { entries: [{ category: "Student", price: 0 }] }],
    ["prizes", { prizes: [{ reward: "Gift card" }] }],
    ["howToJoin", { participationSteps: ["Complete registration."] }],
    ["rules", { eventRules: [{ text: "Follow the code of conduct." }] }],
    ["security", { securityRequirements: [{ text: "Bring photo ID." }] }],
    ["organizerTeam", { organizerTeam: [{ name: "Event Lead" }] }],
    ["contact", { organizerContact: { whatsapp: "+911234567890" } }],
  ];

  for (const [visibleSection, eventData] of sectionCases) {
    const visibility = getOptionalEventSectionVisibility(eventData);
    assert.deepEqual(
      Object.keys(visibility).filter((section) => visibility[section]),
      [visibleSection],
    );
  }
});

test("supports legacy rule and entry representations without accepting empty defaults", () => {
  assert.deepEqual(
    getOptionalEventSectionVisibility({
      fee: 0,
      rules: ["", "Bring valid identification."],
      security: [{ type: "Other", text: "" }],
      entryFee: { isFree: true },
    }),
    {
      entry: true,
      prizes: false,
      howToJoin: false,
      rules: true,
      security: false,
      organizerTeam: false,
      contact: false,
    },
  );
});

test("shows Entry when a meaningful fee note accompanies default entry rows", () => {
  assert.deepEqual(
    getOptionalEventSectionVisibility({
      entries: [{
        category: "General / All",
        participationType: "Solo",
        isPaid: "No",
        price: 0,
      }],
      entryFee: { note: "Fees vary by participation category." },
    }),
    {
      entry: true,
      prizes: false,
      howToJoin: false,
      rules: false,
      security: false,
      organizerTeam: false,
      contact: false,
    },
  );
});

test("recognizes a configured prize pool and legacy entry amounts", () => {
  assert.deepEqual(
    getOptionalEventSectionVisibility({
      totalPrizePool: 5000,
      entryFee: {},
      fee: 250,
    }),
    {
      entry: true,
      prizes: true,
      howToJoin: false,
      rules: false,
      security: false,
      organizerTeam: false,
      contact: false,
    },
  );
});

test("shows only the postponed section for postponed events", () => {
  assert.deepEqual(getEventStatusSectionVisibility("postponed"), {
    postponed: true,
    cancelled: false,
  });
});

test("shows only the cancelled section for cancelled events", () => {
  assert.deepEqual(getEventStatusSectionVisibility("cancelled"), {
    postponed: false,
    cancelled: true,
  });
});

test("hides both status sections for other event statuses", () => {
  for (const status of ["upcoming", "live", "completed", "ended", "", null]) {
    assert.deepEqual(getEventStatusSectionVisibility(status), {
      postponed: false,
      cancelled: false,
    });
  }
});
