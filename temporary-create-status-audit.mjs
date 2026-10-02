import { execSync } from 'node:child_process';

const loginOrganizer = async () => {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'organizer@crt.com', password: 'Organizer@123456' }),
  });

  const text = await res.text();
  const cookies = (res.headers.getSetCookie ? res.headers.getSetCookie() : []).map((part) => part.split(';')[0]).join('; ');

  if (res.status < 200 || res.status >= 300 || !cookies) {
    throw new Error(`Login failed: ${res.status} :: ${text.slice(0, 600)}`);
  }

  return cookies;
};

const createEvent = async (cookieHeader) => {
  const now = new Date();
  const endAt = new Date(now.getTime() + 30 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d) => `${String(d.getHours() % 12 || 12).padStart(2, '0')}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  const startAt = new Date(endAt.getTime() - 15 * 60 * 1000);

  const payload = {
    title: `READ_ONLY_CREATE_STATUS_AUDIT_${Date.now()}`,
    category: 'Tech',
    eventMode: 'Offline',
    state: 'Kerala',
    city: 'Kochi',
    location: 'Read-only audit venue',
    venueAddress: 'Read-only audit venue, Kochi, Kerala',
    eventDate: fmtDate(endAt),
    eventEndDate: fmtDate(endAt),
    eventStartTime: fmtTime(startAt),
    eventEndTime: fmtTime(endAt),
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

  const res = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const json = JSON.parse(text || '{}');
  const event = json?.data?.event ?? json?.event ?? {};
  return { resStatus: res.status, bodyText: text, event };
};

const getMongoDoc = (eventId) => {
  const cmd = `import mongoose from 'mongoose'; await mongoose.connect('mongodb://mongo:27017/CRT', { serverSelectionTimeoutMS: 5000 }); const doc = await mongoose.connection.db.collection('events').findOne({ _id: '${eventId}' }, { projection: { _id: 1, title: 1, status: 1, createdAt: 1, updatedAt: 1, eventDate: 1, eventEndDate: 1, eventStartTime: 1, eventEndTime: 1 } }); console.log(JSON.stringify({ found: !!doc, status: doc ? doc.status : null, doc: doc || null }, null, 2)); await mongoose.disconnect();`;
  return execSync(`docker exec crt-backend-1 node --input-type=module -e ${JSON.stringify(cmd)}`, { encoding: 'utf8' });
};

const main = async () => {
  const cookieHeader = await loginOrganizer();
  const { resStatus, bodyText, event } = await createEvent(cookieHeader);
  const eventId = String(event._id || '');

  console.log('CREATE_RESPONSE_STATUS', resStatus);
  console.log('CREATE_RESPONSE_EVENT', JSON.stringify({ _id: eventId, title: event.title || null, status: event.status || null, createdAt: event.createdAt || null, updatedAt: event.updatedAt || null }, null, 2));

  const mongoOutput = eventId ? getMongoDoc(eventId) : 'NO_EVENT_ID';
  console.log('MONGO_IMMEDIATE_CHECK');
  console.log(mongoOutput);
};

await main();
