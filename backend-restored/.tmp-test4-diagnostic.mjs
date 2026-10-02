import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import setupSocket from './src/socket/socket.server.js';
import { generateAccessToken } from './src/shared/utils/token.js';

const TIMEOUT_MS = 10000;
const state = {
  DEPENDENCY_RESOLUTION: 'FAIL',
  MONGO_CONNECT: 'FAIL',
  HTTP_SERVER: 'FAIL',
  SOCKET_SETUP: 'FAIL',
  UNAUTH_CONNECT_ERROR: 'FAIL',
  AUTH_CONNECT: 'FAIL',
  USER_JOIN: 'FAIL',
  EVENT_UPDATED: 'FAIL',
  LOCATION_UPDATED: 'FAIL',
  CLEANUP: 'FAIL',
  FIRST_BLOCKING_OPERATION: 'NONE',
  ROOT_CAUSE_CONFIRMED: 'NO',
  CATEGORY: 'NONE',
};

const withTimeout = async (label, fn) => {
  let timeoutId;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label}:TIMEOUT`)), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const record = (name, value) => {
  state[name] = value;
  console.log(`${name}: ${value}`);
};

const onTimeout = (name) => {
  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    state.FIRST_BLOCKING_OPERATION = name;
  }
  record(name, 'TIMEOUT');
  console.log(`FIRST_BLOCKING_OPERATION: ${state.FIRST_BLOCKING_OPERATION}`);
};

const mark = (name, status) => {
  if (status === 'TIMEOUT' && state.FIRST_BLOCKING_OPERATION === 'NONE') {
    state.FIRST_BLOCKING_OPERATION = name;
  }
  record(name, status);
};

let httpServer = null;
let io = null;
let badClient = null;
let goodClient = null;

try {
  for (const spec of [
    'mongoose',
    'socket.io-client',
    'node:test',
    'node:assert/strict',
    'node:fs',
    'node:http',
    'node:events',
    './src/model/notification.model.js',
    './src/module/notification/notification.service.js',
    './src/socket/socket.server.js',
    './src/shared/utils/token.js',
    '../User/src/feature/Notification/utils/notificationStateMatcher.js',
  ]) {
    try {
      await import(spec);
      console.log(`RESOLVE_OK ${spec}`);
    } catch (err) {
      console.log(`RESOLVE_FAIL ${spec} ${err && err.message ? err.message : String(err)}`);
      throw err;
    }
  }
  state.DEPENDENCY_RESOLUTION = 'PASS';
  console.log(`DEPENDENCY_RESOLUTION: ${state.DEPENDENCY_RESOLUTION}`);

  console.log('STEP A: Mongo connect start');
  await withTimeout('MONGO_CONNECT', async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CRT';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  });
  console.log('STEP A: Mongo connect OK');
  state.MONGO_CONNECT = 'PASS';
  console.log(`MONGO_CONNECT: ${state.MONGO_CONNECT}`);

  console.log('STEP B: create HTTP server start');
  httpServer = createServer();
  console.log('STEP B: create HTTP server OK');
  state.HTTP_SERVER = 'PASS';
  console.log(`HTTP_SERVER: ${state.HTTP_SERVER}`);

  console.log('STEP C: setupSocket start');
  io = setupSocket(httpServer);
  console.log('STEP C: setupSocket OK');
  state.SOCKET_SETUP = 'PASS';
  console.log(`SOCKET_SETUP: ${state.SOCKET_SETUP}`);

  console.log('STEP D: httpServer.listen start');
  await withTimeout('HTTP_SERVER_LISTEN', async () => {
    await new Promise((resolve) => httpServer.listen(0, resolve));
  });
  console.log('STEP D: httpServer.listen OK');

  const port = httpServer.address().port;
  console.log(`STEP E: create unauthenticated client on port ${port}`);
  badClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 2000,
  });
  console.log('STEP E: unauth client created');

  console.log('STEP F: wait for connect_error');
  try {
    const [error] = await withTimeout('UNAUTH_CONNECT_ERROR', async () => once(badClient, 'connect_error'));
    if (error) {
      console.log('STEP F: connect_error received', error && error.message ? error.message : String(error));
      state.UNAUTH_CONNECT_ERROR = 'PASS';
    } else {
      console.log('STEP F: connect_error event without error object');
      state.UNAUTH_CONNECT_ERROR = 'FAIL';
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.log('STEP F: timeout/error', msg);
    if (msg.includes('TIMEOUT')) {
      state.UNAUTH_CONNECT_ERROR = 'TIMEOUT';
      if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'UNAUTH_CONNECT_ERROR';
    } else {
      state.UNAUTH_CONNECT_ERROR = 'FAIL';
    }
  }
  console.log(`UNAUTH_CONNECT_ERROR: ${state.UNAUTH_CONNECT_ERROR}`);

  if (badClient && badClient.connected) {
    console.log('BAD_CLIENT still connected after auth failure; closing');
    badClient.close();
  }

  console.log('STEP G: close unauthenticated client');
  try {
    if (badClient) {
      badClient.removeAllListeners();
      badClient.disconnect();
      badClient.close();
    }
    console.log('STEP G: unauth client closed');
  } catch (err) {
    console.log('STEP G: close error', err && err.message ? err.message : String(err));
  }

  console.log('STEP H: create authenticated client');
  goodClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 2000,
    auth: { token: generateAccessToken('room-user', 'USER', ['USER']) },
  });
  console.log('STEP H: authenticated client created');

  console.log('STEP I: wait for connect');
  try {
    await withTimeout('AUTH_CONNECT', async () => once(goodClient, 'connect'));
    console.log('STEP I: auth connect OK');
    state.AUTH_CONNECT = 'PASS';
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.log('STEP I: auth connect failed', msg);
    if (msg.includes('TIMEOUT')) {
      state.AUTH_CONNECT = 'TIMEOUT';
      if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'AUTH_CONNECT';
    } else {
      state.AUTH_CONNECT = 'FAIL';
    }
  }
  console.log(`AUTH_CONNECT: ${state.AUTH_CONNECT}`);

  if (state.AUTH_CONNECT === 'PASS') {
    console.log('STEP J: emit user:join');
    goodClient.emit('user:join', {});
    console.log('STEP J: emit sent');

    console.log('STEP K: wait for join result');
    try {
      await withTimeout('USER_JOIN', async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const roomExists = io.sockets.adapter.rooms.has('user:room-user');
        if (!roomExists) {
          throw new Error('ROOM_NOT_FOUND');
        }
      });
      console.log('STEP K: join result OK');
      state.USER_JOIN = 'PASS';
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.log('STEP K: join failed', msg);
      if (msg.includes('TIMEOUT') || msg === 'ROOM_NOT_FOUND') {
        state.USER_JOIN = 'TIMEOUT';
        if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'USER_JOIN';
      } else {
        state.USER_JOIN = 'FAIL';
      }
    }
    console.log(`USER_JOIN: ${state.USER_JOIN}`);

    if (state.USER_JOIN === 'PASS') {
      console.log('STEP L: emit event:updated');
      io.emit('event:updated', { eventId: 'evt-1', status: 'updated' });
      console.log('STEP L: emitted event');

      console.log('STEP M: wait for event:updated');
      try {
        const [eventPayload] = await withTimeout('EVENT_UPDATED', async () => once(goodClient, 'event:updated'));
        console.log('STEP M: event:updated payload', eventPayload);
        if (eventPayload && String(eventPayload.eventId) === 'evt-1') {
          state.EVENT_UPDATED = 'PASS';
        } else {
          state.EVENT_UPDATED = 'FAIL';
        }
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.log('STEP M: event:updated timeout/fail', msg);
        if (msg.includes('TIMEOUT')) {
          state.EVENT_UPDATED = 'TIMEOUT';
          if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'EVENT_UPDATED';
        } else {
          state.EVENT_UPDATED = 'FAIL';
        }
      }
      console.log(`EVENT_UPDATED: ${state.EVENT_UPDATED}`);

      console.log('STEP N: emit user:location-updated');
      io.emit('user:location-updated', { state: 'Tamil Nadu', city: 'Chennai' });
      console.log('STEP N: emitted location update');

      console.log('STEP O: wait for user:location-updated');
      try {
        const [locationPayload] = await withTimeout('LOCATION_UPDATED', async () => once(goodClient, 'user:location-updated'));
        console.log('STEP O: location payload', locationPayload);
        if (locationPayload && String(locationPayload.city) === 'Chennai') {
          state.LOCATION_UPDATED = 'PASS';
        } else {
          state.LOCATION_UPDATED = 'FAIL';
        }
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.log('STEP O: location update timeout/fail', msg);
        if (msg.includes('TIMEOUT')) {
          state.LOCATION_UPDATED = 'TIMEOUT';
          if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'LOCATION_UPDATED';
        } else {
          state.LOCATION_UPDATED = 'FAIL';
        }
      }
      console.log(`LOCATION_UPDATED: ${state.LOCATION_UPDATED}`);
    }
  }

  console.log('STEP P: cleanup socket/server');
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
    state.CLEANUP = 'PASS';
  } catch (err) {
    console.log('STEP P: cleanup failed', err && err.message ? err.message : String(err));
    state.CLEANUP = 'FAIL';
  }
  console.log(`CLEANUP: ${state.CLEANUP}`);

  console.log('STEP Q: mongoose disconnect');
  try {
    await withTimeout('MONGOOSE_DISCONNECT', async () => {
      await mongoose.disconnect();
    });
    console.log('STEP Q: mongoose disconnect OK');
  } catch (err) {
    console.log('STEP Q: mongoose disconnect failed', err && err.message ? err.message : String(err));
  }

  if (state.FIRST_BLOCKING_OPERATION === 'NONE') {
    state.ROOT_CAUSE_CONFIRMED = 'NO';
    state.CATEGORY = 'NONE';
  } else {
    state.ROOT_CAUSE_CONFIRMED = 'YES';
    if (state.FIRST_BLOCKING_OPERATION === 'UNAUTH_CONNECT_ERROR') state.CATEGORY = 'SOCKET_AUTH_HANDSHAKE';
    else if (state.FIRST_BLOCKING_OPERATION === 'AUTH_CONNECT') state.CATEGORY = 'SOCKET_AUTH_CONNECT';
    else if (state.FIRST_BLOCKING_OPERATION === 'USER_JOIN') state.CATEGORY = 'SOCKET_ROOM_JOIN';
    else if (state.FIRST_BLOCKING_OPERATION === 'EVENT_UPDATED') state.CATEGORY = 'SOCKET_EVENT_EMIT';
    else if (state.FIRST_BLOCKING_OPERATION === 'LOCATION_UPDATED') state.CATEGORY = 'SOCKET_LOCATION_EVENT';
    else state.CATEGORY = 'SOCKET_TEST_HANG';
  }

  console.log(`FIRST_BLOCKING_OPERATION: ${state.FIRST_BLOCKING_OPERATION}`);
  console.log(`ROOT_CAUSE_CONFIRMED: ${state.ROOT_CAUSE_CONFIRMED}`);
  console.log(`CATEGORY: ${state.CATEGORY}`);
} catch (err) {
  console.log('DIAGNOSTIC_FATAL', err && err.message ? err.message : String(err));
  if (state.FIRST_BLOCKING_OPERATION === 'NONE') state.FIRST_BLOCKING_OPERATION = 'DEPENDENCY_RESOLUTION';
  state.ROOT_CAUSE_CONFIRMED = 'YES';
  state.CATEGORY = 'DEPENDENCY_RESOLUTION';
  console.log(`FIRST_BLOCKING_OPERATION: ${state.FIRST_BLOCKING_OPERATION}`);
  console.log(`ROOT_CAUSE_CONFIRMED: ${state.ROOT_CAUSE_CONFIRMED}`);
  console.log(`CATEGORY: ${state.CATEGORY}`);
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
      await new Promise((resolve) => io.close(() => resolve()));
    }
    if (httpServer && httpServer.listening) {
      await new Promise((resolve) => httpServer.close(() => resolve()));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // swallow cleanup errors for temporary diagnostic
  }
}
