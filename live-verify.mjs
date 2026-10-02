import fs from 'node:fs/promises';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fmtTime = (date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${suffix}`;
};

const login = async () => {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'organizer@crt.com', password: 'Organizer@123456' })
  });

  const raw = res.headers.get('set-cookie') || '';
  const userAccess = (raw.match(/(?:^|, )userAccessToken=([^;]+)/) || [])[1];
  const userRefresh = (raw.match(/(?:^|, )userRefreshToken=([^;]+)/) || [])[1];
  const organizerAccess = (raw.match(/(?:^|, )organizerAccessToken=([^;]+)/) || [])[1];
  const organizerRefresh = (raw.match(/(?:^|, )organizerRefreshToken=([^;]+)/) || [])[1];
  const cookie = [
    userAccess ? `userAccessToken=${userAccess}` : '',
    userRefresh ? `userRefreshToken=${userRefresh}` : '',
    organizerAccess ? `organizerAccessToken=${organizerAccess}` : '',
    organizerRefresh ? `organizerRefreshToken=${organizerRefresh}` : ''
  ].filter(Boolean).join('; ');

  const body = await res.text();
  return { status: res.status, cookie, body };
};

const main = async () => {
  const auth = await login();
  console.log('LOGIN_STATUS', auth.status);
  console.log('LOGIN_BODY', auth.body);

  if (auth.status !== 200 || !auth.cookie) {
    throw new Error('Login failed');
  }

  const now = new Date();
  const eventStart = new Date(now.getTime() + 2000);
  const eventEnd = new Date(now.getTime() + 75 * 1000);
  const payload = {
    title: `LIVE_AUTOCOMPLETE_FIX_${Date.now()}`,
    category: 'Tech',
    tagline: 'Live auto-complete validation',
    description: 'Temporary event used for real live automatic completion verification',
    eventMode: 'Offline',
    state: 'Kerala',
    district: 'Kochi',
    city: 'Kochi',
    location: 'Live validation venue',
    venueAddress: 'Temporary verification venue',
    pinCode: '682001',
    eventDate: eventStart.toISOString().slice(0, 10),
    eventEndDate: eventEnd.toISOString().slice(0, 10),
    eventStartTime: fmtTime(eventStart),
    eventEndTime: fmtTime(eventEnd),
    status: 'upcoming'
  };

  const createRes = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
    body: JSON.stringify(payload)
  });

  const createText = await createRes.text();
  console.log('CREATE_STATUS', createRes.status);
  console.log('CREATE_BODY', createText);

  if (createRes.status >= 400) {
    throw new Error(`Create failed: ${createRes.status}`);
  }

  const created = JSON.parse(createText);
  const eventId = created?.data?.event?._id;
  console.log('EVENT_ID', eventId);

  if (!eventId) {
    throw new Error('No event id returned');
  }

  const deadline = Date.now() + 220000;
  let finalStatus = 'unknown';
  let finalCompletion = null;

  while (Date.now() < deadline) {
    const apiRes = await fetch(`http://localhost:3000/api/events/${eventId}`, {
      headers: { Cookie: auth.cookie }
    });
    const apiText = await apiRes.text();
    const event = JSON.parse(apiText)?.data?.event || {};
    finalStatus = event.status || 'unknown';
    finalCompletion = event.completionConfirmedAt || null;

    console.log('POLL', new Date().toISOString(), 'status=', finalStatus, 'completion=', finalCompletion);

    if (String(finalStatus).toLowerCase() === 'completed') {
      break;
    }

    await sleep(15000);
  }

  console.log('FINAL_STATUS', finalStatus);
  console.log('FINAL_COMPLETION', finalCompletion);

  const publicRes = await fetch(`http://localhost:3000/api/events/public/${eventId}`);
  const publicText = await publicRes.text();
  console.log('PUBLIC_STATUS', publicRes.status);
  console.log('PUBLIC_BODY', publicText);

  if (finalStatus !== 'completed' || !finalCompletion) {
    throw new Error(`Live auto-completion failed: status=${finalStatus}, completion=${finalCompletion}`);
  }

  await fs.unlink('d:/KodeX/CRT-test/live-verify.mjs').catch(() => {});
};

main().catch((error) => {
  console.error('LIVE_VERIFY_ERROR', error);
  process.exit(1);
});
