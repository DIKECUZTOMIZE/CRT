process.env.CORS_ORIGIN = 'http://localhost:5174';
process.env.ACCESS_TOKEN_SECRET = '0123456789abcdef0123456789abcdef';
process.env.REFRESH_TOKEN_SECRET = 'fedcba9876543210fedcba9876543210';

const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const jwt = (await import('jsonwebtoken')).default;

const { authMiddleware } = await import('./auth.middleware.js');
const { default: config } = await import('../config/config.js');

const makeReq = ({ role, origin = 'http://localhost:5174', cookieName = 'adminAccessToken' }) => ({
  headers: { origin },
  cookies: { [cookieName]: jwt.sign({ sub: 'admin-1', role }, config.auth.accessTokenSecret) },
  user: undefined,
});

const makeRes = () => ({
  statusCode: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json() {
    return this;
  },
});

test('admin requests accept ADMIN tokens from the admin client', async () => {
  let called = false;
  const req = makeReq({ role: 'ADMIN' });
  const res = makeRes();
  const next = () => {
    called = true;
  };

  authMiddleware(req, res, next);

  assert.equal(called, true);
  assert.equal(req.user.role, 'ADMIN');
});

test('admin tokens are rejected on the organizer client', async () => {
  let nextArg = null;
  const req = makeReq({ role: 'ADMIN', origin: 'http://localhost:5175', cookieName: 'organizerAccessToken' });
  const res = makeRes();
  const next = (error) => {
    nextArg = error;
  };

  authMiddleware(req, res, next);

  assert.ok(nextArg);
  assert.equal(nextArg.message, 'Role mismatch for this app');
});

test('admin bearer tokens are rejected on the organizer client even without cookies', async () => {
  let nextArg = null;
  const req = {
    headers: {
      origin: 'http://localhost:5175',
      authorization: `Bearer ${jwt.sign({ sub: 'admin-1', role: 'ADMIN' }, config.auth.accessTokenSecret)}`,
    },
    cookies: {},
  };
  const res = makeRes();
  const next = (error) => {
    nextArg = error;
  };

  authMiddleware(req, res, next);

  assert.ok(nextArg);
  assert.equal(nextArg.message, 'Role mismatch for this app');
});

test('valid admin bearer tokens are accepted even without an Origin header', async () => {
  let called = false;
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign({ sub: 'admin-1', role: 'ADMIN' }, config.auth.accessTokenSecret)}`,
    },
    cookies: {},
  };
  const res = makeRes();
  const next = () => {
    called = true;
  };

  authMiddleware(req, res, next);

  assert.equal(called, true);
  assert.equal(req.user.role, 'ADMIN');
});

test('user requests ignore stale organizer cookies and return authentication required', async () => {
  let nextArg = null;
  const req = {
    headers: { origin: 'http://localhost:5173' },
    cookies: {
      organizerAccessToken: jwt.sign({ sub: 'organizer-1', role: 'ORGANIZER' }, config.auth.accessTokenSecret),
    },
  };
  const res = makeRes();
  const next = (error) => {
    nextArg = error;
  };

  authMiddleware(req, res, next);

  assert.ok(nextArg);
  assert.equal(nextArg.message, 'Authentication required');
});

test('cookie header fallback works when req.cookies is not populated', async () => {
  let called = false;
  const token = jwt.sign({ sub: 'user-123', role: 'USER' }, config.auth.accessTokenSecret);
  const req = {
    headers: { origin: 'http://localhost:5173', cookie: `userAccessToken=${encodeURIComponent(token)}` },
    cookies: {},
  };
  const res = makeRes();
  const next = () => {
    called = true;
  };

  authMiddleware(req, res, next);

  assert.equal(called, true);
  assert.equal(req.user.role, 'USER');
});
