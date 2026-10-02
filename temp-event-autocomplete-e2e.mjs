import { execSync } from 'node:child_process';

const apiBase = 'http://localhost:3000';
const organizerEmail = 'organizer@crt.com';
const organizerPassword = 'Organizer@123456';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loginOrganizer = async () => {
  const loginRes = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: organizerEmail, password: organizerPassword }),
  });

  const loginText = await loginRes.text();
  const setCookieHeader = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  const cookieHeader = setCookieHeader.map((part) => part.split(';')[0]).join('; ');

  if (!cookieHeader) {
    throw new Error(`Organizer login failed: status=${loginRes.status}; body=${loginText.slice(0, 500)}`);
  }

  return cookieHeader;
};

const createTestEvent = async (cookieHeader) => {
  const now = new Date();
  const endAt = new Date(now.getTime() + 2 * 60 * 1000 + 20 * 1000);
  const startAt = new Date(endAt.getTime() - 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const formatTime = (d) => `${String(d.getHours() % 12 || 12).padStart(2, '0')}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;

  const payload = {
    title: `AUTO_COMPLETE_E2E_${Date.now()}`,
    category: 'Tech',
    eventMode: 'Offline',
    state: 'Kerala',
    city: 'Kochi',
    location: 'E2E Auto Completion Test Venue',
    venueAddress: 'E2E Auto Completion Test Venue, Kochi, Kerala',
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

  const createRes = await fetch(`${apiBase}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });

  const createText = await createRes.text();
  const createJson = JSON.parse(createText || '{}');
  const event = createJson?.data?.event ?? createJson?.event ?? {};

  const result = {
    eventId: String(event._id || ''),
    title: event.title || payload.title,
    statusBeforeExpiry: event.status || 'upcoming',
    scheduledEndDateTime: `${event.eventEndDate || payload.eventEndDate} ${event.eventEndTime || payload.eventEndTime}`,
    scheduledEndIso: endAt.toISOString(),
    createdAt: event.createdAt || null,
    updatedAt: event.updatedAt || null,
    createdAtIso: now.toISOString(),
    currentTimeAtCreateIso: now.toISOString(),
  };

  if (!result.eventId) {
    throw new Error(`Event creation failed: status=${createRes.status}; body=${createText.slice(0, 800)}`);
  }

  console.log('CREATE_BASELINE', JSON.stringify(result, null, 2));
  return { ...result, expectedExpiryAt: endAt.getTime() };
};

const readMongoEvent = (eventId) => {
  const mongoScript = `
    import mongoose from 'mongoose';
    await mongoose.connect('mongodb://mongo:27017/CRT', { serverSelectionTimeoutMS: 5000 });
    const doc = await mongoose.connection.db.collection('events').findOne({ _id: '${eventId}' }, {
      projection: { _id: 1, title: 1, status: 1, completionConfirmedAt: 1, createdAt: 1, updatedAt: 1, eventEndDate: 1, eventEndTime: 1, eventDate: 1, eventStartTime: 1 }
    });
    console.log(JSON.stringify({ mongoStatus: doc ? doc.status : null, doc: doc || null }, null, 2));
    await mongoose.disconnect();
  `;

  const output = execSync(`docker exec crt-backend-1 node --input-type=module -e ${JSON.stringify(mongoScript)}`, { encoding: 'utf8' });
  return output;
};

const readBackendLogs = (search) => {
  const output = execSync(`docker logs crt-backend-1 --tail 200`, { encoding: 'utf8' });
  const lines = output.split(/\r?\n/);
  const matches = lines.filter((line) => line.toLowerCase().includes(search.toLowerCase()));
  return matches.slice(-20).join('\n');
};

const main = async () => {
  const cookieHeader = await loginOrganizer();
  const baseline = await createTestEvent(cookieHeader);
  const waitMs = Math.max(0, baseline.expectedExpiryAt - Date.now() + 85_000);
  console.log('WAIT_MS_BEFORE_CHECK', waitMs);
  await sleep(waitMs);

  const mongoOutput = readMongoEvent(baseline.eventId);
  console.log('MONGO_AFTER_EXPIRY', mongoOutput);

  const logOutput = readBackendLogs('auto-completion');
  console.log('BACKEND_SCHEDULER_LOG', logOutput || 'No matching scheduler log found');

  const backendEventRes = await fetch(`${apiBase}/api/events/${baseline.eventId}`, {
    headers: { Cookie: cookieHeader },
  });
  const backendEventText = await backendEventRes.text();
  console.log('BACKEND_EVENT_FETCH_STATUS', backendEventRes.status);
  console.log('BACKEND_EVENT_FETCH_BODY', backendEventText.slice(0, 1000));
};

await main();
