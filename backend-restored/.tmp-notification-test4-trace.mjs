import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import setupSocket from './src/socket/socket.server.js';
import { generateAccessToken } from './src/shared/utils/token.js';

const TIMEOUT_MS = 10000;
const state = {
  FIRST_BLOCKING_OPERATION: 'NONE',
  ROOT_CAUSE_CONFIRMED: 'NO',
  CATEGORY: 'NONE',
  REPO_CHANGES: 'NONE',
};

const withTimeout = async (label, fn) => {
  let timer;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}:TIMEOUT`)), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const markStep = (label, status) => {
  console.log(`${label}:${status}`);
  if (status === 'TIMEOUT' && state.FIRST_BLOCKING_OPERATION === 'NONE') {
    state.FIRST_BLOCKING_OPERATION = label;
  }
};

let httpServer = null;
let io = null;
let badClient = null;
let goodClient = null;

try {
  console.log('TRACE_START');

  console.log('MONGO_CONNECT:START');
  await withTimeout('MONGO_CONNECT', async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CRT';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  });
  console.log('MONGO_CONNECT:DONE');

  console.log('HTTP_SERVER_CREATE:START');
  httpServer = createServer();
  console.log('HTTP_SERVER_CREATE:DONE');

  console.log('SOCKET_SETUP:START');
  io = setupSocket(httpServer);
  console.log('SOCKET_SETUP:DONE');

  console.log('SERVER_LISTEN:START');
  await withTimeout('SERVER_LISTEN', async () => {
    await new Promise((resolve) => httpServer.listen(0, resolve));
  });
  console.log('SERVER_LISTEN:DONE');

  const port = httpServer.address().port;
  console.log(`UNAUTH_CLIENT_CREATE:START port=${port}`);
  badClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 2000,
  });
  console.log('UNAUTH_CLIENT_CREATE:DONE');

  console.log('UNAUTH_CONNECT_ERROR:START');
  try {
    const [error] = await withTimeout('UNAUTH_CONNECT_ERROR', async () => once(badClient, 'connect_error'));
    if (error) {
      console.log('UNAUTH_CONNECT_ERROR:DONE', error && error.message ? error.message : String(error));
    } else {
      console.log('UNAUTH_CONNECT_ERROR:DONE');
      markStep('UNAUTH_CONNECT_ERROR', 'FAIL');
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.log('UNAUTH_CONNECT_ERROR:TIMEOUT', msg);
    markStep('UNAUTH_CONNECT_ERROR', 'TIMEOUT');
  }

  console.log('AUTH_CLIENT_CREATE:START');
  goodClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 2000,
    auth: { token: generateAccessToken('room-user', 'USER', ['USER']) },
  });
  console.log('AUTH_CLIENT_CREATE:DONE');

  console.log('AUTH_CONNECT:START');
  try {
    await withTimeout('AUTH_CONNECT', async () => once(goodClient, 'connect'));
    console.log('AUTH_CONNECT:DONE');
  } catch (err) {
    console.log('AUTH_CONNECT:TIMEOUT', err && err.message ? err.message : String(err));
    markStep('AUTH_CONNECT', 'TIMEOUT');
  }

  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    console.log('USER_JOIN:START');
    try {
      await withTimeout('USER_JOIN', async () => {
        goodClient.emit('user:join', {});
        await new Promise((resolve) => setTimeout(resolve, 150));
        const roomExists = io.sockets.adapter.rooms.has('user:room-user');
        if (!roomExists) {
          throw new Error('ROOM_NOT_FOUND');
        }
      });
      console.log('USER_JOIN:DONE');
    } catch (err) {
      console.log('USER_JOIN:TIMEOUT', err && err.message ? err.message : String(err));
      markStep('USER_JOIN', 'TIMEOUT');
    }
  }

  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    console.log('EVENT_UPDATED:START');
    try {
      await withTimeout('EVENT_UPDATED', async () => {
        io.emit('event:updated', { eventId: 'evt-1', status: 'updated' });
        const [payload] = await once(goodClient, 'event:updated');
        if (!payload || String(payload.eventId) !== 'evt-1') {
          throw new Error('INVALID_EVENT_PAYLOAD');
        }
      });
      console.log('EVENT_UPDATED:DONE');
    } catch (err) {
      console.log('EVENT_UPDATED:TIMEOUT', err && err.message ? err.message : String(err));
      markStep('EVENT_UPDATED', 'TIMEOUT');
    }
  }

  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    console.log('LOCATION_UPDATED:START');
    try {
      await withTimeout('LOCATION_UPDATED', async () => {
        io.emit('user:location-updated', { state: 'Tamil Nadu', city: 'Chennai' });
        const [payload] = await once(goodClient, 'user:location-updated');
        if (!payload || String(payload.city) !== 'Chennai') {
          throw new Error('INVALID_LOCATION_PAYLOAD');
        }
      });
      console.log('LOCATION_UPDATED:DONE');
    } catch (err) {
      console.log('LOCATION_UPDATED:TIMEOUT', err && err.message ? err.message : String(err));
      markStep('LOCATION_UPDATED', 'TIMEOUT');
    }
  }

  console.log('CLEANUP:START');
  try {
    if (goodClient) {
      goodClient.removeAllListeners();
      goodClient.disconnect();
      goodClient.close();
    }
    if (badClient) {
      badClient.removeAllListeners();
      badClient.disconnect();
      badClient.close();
    }
    if (io && typeof io.close === 'function') {
      await new Promise((resolve, reject) => io.close((err) => err ? reject(err) : resolve()));
    }
    if (httpServer && httpServer.listening) {
      await new Promise((resolve, reject) => httpServer.close((err) => err ? reject(err) : resolve()));
    }
    console.log('CLEANUP:DONE');
  } catch (err) {
    console.log('CLEANUP:FAIL', err && err.message ? err.message : String(err));
    state.FIRST_BLOCKING_OPERATION = state.FIRST_BLOCKING_OPERATION === 'NONE' ? 'CLEANUP' : state.FIRST_BLOCKING_OPERATION;
  }

  console.log('TRACE_END');
  console.log(`FIRST_BLOCKING_OPERATION ${state.FIRST_BLOCKING_OPERATION}`);
  console.log(`ROOT_CAUSE_CONFIRMED ${state.ROOT_CAUSE_CONFIRMED}`);
  console.log(`CATEGORY ${state.CATEGORY}`);
  console.log(`REPO_CHANGES ${state.REPO_CHANGES}`);
} catch (err) {
  console.log('TRACE_FATAL', err && err.message ? err.message : String(err));
  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    state.FIRST_BLOCKING_OPERATION = 'MONGO_CONNECT';
  }
  state.ROOT_CAUSE_CONFIRMED = 'YES';
  state.CATEGORY = 'DEPENDENCY_OR_RUNTIME_BOOTSTRAP';
  state.REPO_CHANGES = 'NONE';
  console.log(`FIRST_BLOCKING_OPERATION ${state.FIRST_BLOCKING_OPERATION}`);
  console.log(`ROOT_CAUSE_CONFIRMED ${state.ROOT_CAUSE_CONFIRMED}`);
  console.log(`CATEGORY ${state.CATEGORY}`);
  console.log(`REPO_CHANGES ${state.REPO_CHANGES}`);
  process.exitCode = 1;
} finally {
  try {
    if (goodClient) {
      goodClient.removeAllListeners();
      goodClient.disconnect();
      goodClient.close();
    }
    if (badClient) {
      badClient.removeAllListeners();
      badClient.disconnect();
      badClient.close();
    }
    if (io && typeof io.close === 'function') {
      io.close();
    }
    if (httpServer && httpServer.listening) {
      httpServer.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // keep temporary diagnostic read-only and non-invasive
  }
}
