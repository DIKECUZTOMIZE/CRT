import mongoose from "mongoose";
import connectDB from "./src/config/database.js";
import EventModel from "./src/model/event.model.js";

await connectDB();
const now = new Date();
const start = new Date(now.getTime() + 5000);
const end = new Date(start.getTime() + 30000);
const title = `SHORT_EXPIRY_TEST_${Date.now()}`;
const payload = {
  organizerId: "org-auto-live-check",
  title,
  category: "Tech",
  eventDate: start.toISOString().slice(0, 10),
  eventStartTime: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
  eventEndDate: end.toISOString().slice(0, 10),
  eventEndTime: end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
  status: "upcoming",
  completionConfirmedAt: null,
  entries: [],
  prizes: [],
  eventRules: [],
  securityRequirements: [],
  participationSteps: [],
  organizerTeam: [],
  customFields: [],
  state: "Kerala",
  city: "Kochi",
  district: "Ernakulam",
  location: "Temporary verification venue",
  venueAddress: "Temporary verification venue, Kochi, Ernakulam, Kerala, 682001",
};

const created = await EventModel.create(payload);
console.log(JSON.stringify({
  eventId: String(created._id),
  title,
  start: created.eventDate + " " + created.eventStartTime,
  end: created.eventEndDate + " " + created.eventEndTime,
  status: created.status,
}));

for (let i = 0; i < 7; i++) {
  const fresh = await EventModel.findById(created._id).lean();
  console.log(JSON.stringify({
    tick: i + 1,
    status: fresh?.status ?? null,
    completionConfirmedAt: fresh?.completionConfirmedAt ?? null,
    now: new Date().toISOString(),
  }));

  if (fresh && fresh.status === "completed") {
    await mongoose.disconnect();
    process.exit(0);
  }

  await new Promise((resolve) => setTimeout(resolve, 15000));
}

const finalDoc = await EventModel.findById(created._id).lean();
console.log(JSON.stringify({
  completed: false,
  finalStatus: finalDoc?.status ?? null,
  finalCompletionConfirmedAt: finalDoc?.completionConfirmedAt ?? null,
  checkedAt: new Date().toISOString(),
}));
await mongoose.disconnect();
process.exit(0);
