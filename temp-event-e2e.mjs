import { execSync } from 'node:child_process';

const now = new Date();
const endAt = new Date(now.getTime() + 2 * 60 * 1000 + 15 * 1000);
const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatTime = (d) => `${String(d.getHours() % 12 || 12).padStart(2, '0')}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
const startAt = new Date(endAt.getTime() - 60 * 1000);
const title = 'AUTO_COMPLETE_E2E_' + Date.now();

const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'organizer@crt.com', password: 'Organizer@123456' }),
});

const loginText = await loginRes.text();
const cookieHeader = loginRes.headers.getSetCookie?.().map((part) => part.split(';')[0]).join('; ') || '';
if (!cookieHeader) {
  throw new Error(`No organizer auth cookies returned. status=${loginRes.status}. body=${loginText.slice(0, 500)}`);
}

const payload = {
  title,
  category: 'Tech',
  eventMode: 'Offline',
  state: 'Kerala',
  city: 'Kochi',
  location: 'E2E Live Test Venue',
  venueAddress: 'E2E Live Test Venue, Kochi, Kerala',
  eventDate: formatDate(endAt),
  eventEndDate: formatDate(endAt),
  eventStartTime: formatTime(startAt),
  eventEndTime: formatTime(endAt),
  status: 'upcoming',
  totalSeats: 50,
  seatAvailability: 'Limited',
  participation: { enabled: false, mode: 'Solo' },
  entries: [],
  prizes: [],
  eventRules: [],
  securityRequirements: [],
  participationSteps: [],
  customFields: [],
  organizerTeam: [],
  schedules: [],
};

const createRes = await fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  body: JSON.stringify(payload),
});
const createText = await createRes.text();
if (createRes.status < 200 || createRes.status >= 300) {
  throw new Error(`Create event failed. status=${createRes.status}. body=${createText.slice(0, 800)}`);
}
const createJson = JSON.parse(createText || '{}');
const event = createJson?.data?.event ?? createJson?.event ?? {};
const eventId = String(event._id || '');

if (!eventId) {
  throw new Error(`No event ID returned. body=${createText.slice(0, 800)}`);
}

const result = {
  eventId,
  title,
  scheduledEndDateTime: `${event.eventEndDate || payload.eventEndDate} ${event.eventEndTime || payload.eventEndTime}`,
  scheduledEndIso: endAt.toISOString(),
  currentStatus: event.status || 'upcoming',
  createdAt: event.createdAt || null,
  updatedAt: event.updatedAt || null,
  createdAtIso: now.toISOString(),
};

console.log(JSON.stringify({ baseline: result }, null, 2));

const mongoQuery = `
  import mongoose from 'mongoose';
  await mongoose.connect('mongodb://mongo:27017/CRT', { serverSelectionTimeoutMS: 5000 });
  const doc = await mongoose.connection.db.collection('events').findOne({ _id: '${eventId}' }, { projection: { _id: 1, title: 1, status: 1, completionConfirmedAt: 1, createdAt: 1, updatedAt: 1, eventEndDate: 1, eventEndTime: 1 } });
  console.log(JSON.stringify({ beforeExpiryMongo: doc || null }, null, 2));
  await mongoose.disconnect();
`;

const mongoOutput = execSync(`docker exec crt-backend-1 node --input-type=module -e ${JSON.stringify(mongoQuery)}`, { encoding: 'utf8' });
console.log(mongoOutput.trim());
