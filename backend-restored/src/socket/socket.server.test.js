import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { io as Client } from 'socket.io-client';

import setupSocket from './socket.server.js';
import { generateAccessToken } from '../shared/utils/token.js';

const closeHttpServer = async (server) => {
  if (!server || !server.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
};

test('anonymous clients can connect without auth and public pages do not get rejected', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);

  try {
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const port = httpServer.address().port;

    const anonymousClient = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 2000,
    });

    await once(anonymousClient, 'connect');
    assert.equal(anonymousClient.connected, true);

    anonymousClient.emit('user:join', { userId: 'public-user' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(io.sockets.adapter.rooms.has('user:public-user'), false);

    anonymousClient.disconnect();
  } finally {
    if (io && typeof io.close === 'function') {
      io.close();
    }
    await closeHttpServer(httpServer);
  }
});

test('authenticated clients still join only their trusted room', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);

  try {
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const port = httpServer.address().port;
    const authToken = generateAccessToken('room-user', 'USER', ['USER']);

    const client = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 2000,
      auth: { token: authToken },
    });

    await once(client, 'connect');
    client.emit('user:join', { userId: 'room-user' });
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.ok(io.sockets.adapter.rooms.has('user:room-user'));
    client.emit('user:join', { userId: 'other-user' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(io.sockets.adapter.rooms.has('user:other-user'), false);

    client.disconnect();
  } finally {
    if (io && typeof io.close === 'function') {
      io.close();
    }
    await closeHttpServer(httpServer);
  }
});
