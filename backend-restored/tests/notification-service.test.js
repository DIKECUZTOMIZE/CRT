import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';

import NotificationModel from '../src/model/notification.model.js';
import {
  createNotificationService,
  getUserNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from '../src/module/notification/notification.service.js';
import { matchesSelectedState } from '../../User/src/feature/Notification/utils/notificationStateMatcher.js';
import setupSocket from '../src/socket/socket.server.js';
import { generateAccessToken } from '../src/shared/utils/token.js';

const restoreReadyState = (previousDescriptor) => {
  if (previousDescriptor) {
    Object.defineProperty(mongoose.connection, 'readyState', previousDescriptor);
    return;
  }

  delete mongoose.connection.readyState;
};

before(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CRT';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
});

after(async () => {
  await mongoose.disconnect();
});

test('state-based notification matcher includes real event metadata for selected state', () => {
  const notification = {
    metadata: {
      state: 'Assam',
      city: 'Guwahati',
      location: 'Guwahati, Assam',
    },
    title: 'New event is live',
    message: 'Notification Check Live is now live in Guwahati, Assam. Explore it now.',
  };

  assert.equal(matchesSelectedState(notification, 'Assam'), true);
  assert.equal(matchesSelectedState(notification, 'Guwahati'), true);
  assert.equal(matchesSelectedState(notification, 'India'), true);
});

test('notification service persists and marks user notifications as read', async () => {
  const userId = new mongoose.Types.ObjectId();

  const notification = await createNotificationService({
    userId,
    title: 'New event update',
    message: 'A competition near you has been updated.',
    type: 'event',
  });

  assert.ok(notification && notification._id, 'notification should be created');
  assert.equal(String(notification.userId), String(userId));

  const list = await getUserNotificationsService(userId, { limit: 10 });
  assert.ok(Array.isArray(list.notifications), 'notifications list should be returned');
  assert.ok(list.notifications.some((item) => String(item._id) === String(notification._id)));

  const result = await markAllNotificationsReadService(userId);
  assert.ok(result && typeof result.modifiedCount === 'number');
  assert.ok(result.modifiedCount >= 1, 'at least one notification should be updated');
});

test('authenticated socket can connect and join only its trusted user room', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const token = generateAccessToken('socket-user-123', 'USER', ['USER']);
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    auth: { token },
  });

  await once(client, 'connect');

  client.emit('user:join', { userId: 'socket-user-123' });
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.ok(io.sockets.adapter.rooms.has('user:socket-user-123'));

  client.emit('user:join', { userId: 'socket-user-999' });
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(io.sockets.adapter.rooms.has('user:socket-user-999'), false);

  client.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 100));
  await new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
});

test('organizer socket can connect from the organizer cookie and join its trusted room', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const token = generateAccessToken('organizer-live-42', 'ORGANIZER', ['ORGANIZER']);
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 2000,
    extraHeaders: {
      Cookie: `organizerAccessToken=${encodeURIComponent(token)}`,
    },
  });

  const [connectedEvent] = await Promise.race([
    once(client, 'connect').then(([value]) => ['connected', value]),
    once(client, 'connect_error').then(([error]) => ['error', error]),
  ]);
  assert.equal(connectedEvent, 'connected', 'organizer cookie token should authenticate the socket');

  client.emit('user:join', {});
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.ok(io.sockets.adapter.rooms.has('user:organizer-live-42'));

  client.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 100));
  await new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
});

test('anonymous socket can connect, avoid user room join, and still receive broadcasts', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);
  let anonymousClient = null;
  let authenticatedClient = null;

  try {
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const port = httpServer.address().port;

    anonymousClient = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 2000,
    });

    await once(anonymousClient, 'connect');
    assert.equal(anonymousClient.connected, true);
    anonymousClient.emit('user:join', { userId: 'anonymous-user' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(io.sockets.adapter.rooms.has('user:anonymous-user'), false);

    authenticatedClient = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 2000,
      auth: { token: generateAccessToken('room-user', 'USER', ['USER']) },
    });

    await once(authenticatedClient, 'connect');
    authenticatedClient.emit('user:join', {});

    await new Promise((resolve) => setTimeout(resolve, 100));

    const eventPromise = once(authenticatedClient, 'event:updated');
    const locationPromise = once(authenticatedClient, 'user:location-updated');

    io.emit('event:updated', { eventId: 'evt-1', status: 'updated' });
    io.emit('user:location-updated', { state: 'Tamil Nadu', city: 'Chennai' });

    const [eventPayload] = await eventPromise;
    const [locationPayload] = await locationPromise;

    assert.equal(eventPayload.eventId, 'evt-1');
    assert.equal(locationPayload.city, 'Chennai');
  } finally {
    const closeClient = (client) => {
      if (!client) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        if (client.connected === false || client.disconnected === true) {
          client.close();
          return resolve();
        }

        const finish = () => {
          client.off('disconnect', finish);
          client.off('connect_error', finish);
          resolve();
        };

        client.once('disconnect', finish);
        client.once('connect_error', finish);
        client.disconnect();
        client.close();
      });
    };

    await closeClient(authenticatedClient);
    await closeClient(anonymousClient);

    await new Promise((resolve) => {
      if (io && typeof io.close === 'function') {
        io.close(() => resolve());
        return;
      }
      resolve();
    });

    await new Promise((resolve, reject) => {
      if (httpServer.listening) {
        httpServer.close((error) => error ? reject(error) : resolve());
        return;
      }
      resolve();
    });
  }
});

test('notifications are delivered only to the intended user and no unread count helpers remain', async () => {
  const httpServer = createServer();
  const io = setupSocket(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;

  const userAClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    auth: { token: generateAccessToken('user-a', 'USER', ['USER']) },
  });
  const userBClient = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    auth: { token: generateAccessToken('user-b', 'USER', ['USER']) },
  });

  await Promise.all([once(userAClient, 'connect'), once(userBClient, 'connect')]);
  userAClient.emit('user:join', {});
  userBClient.emit('user:join', {});

  await new Promise((resolve) => setTimeout(resolve, 150));

  const created = await createNotificationService({
    userId: 'user-a',
    title: 'Private event notice',
    message: 'Only user A should receive this.',
    type: 'system',
  });

  const userAEvent = await once(userAClient, 'notifications:updated');
  const userBEvent = await Promise.race([
    once(userBClient, 'notifications:updated').then(([value]) => value),
    new Promise((resolve) => setTimeout(() => resolve(null), 250)),
  ]);

  assert.ok(userAEvent[0]?.notification?._id === created._id || userAEvent[0]?.notification?.id === created.id);
  assert.equal(userBEvent, null, 'user B must not receive user A notifications');

  const serviceModule = await import('../src/module/notification/notification.service.js');
  assert.equal('getUnreadNotificationCountService' in serviceModule, false, 'unread-count helper must not exist');

  const list = await getUserNotificationsService('user-a', { limit: 10 });
  assert.equal(Object.prototype.hasOwnProperty.call(list, 'unreadCount'), false, 'notification list must not expose unread count');

  const notificationListFile = readFileSync(new URL('../../User/src/feature/Notification/components/NotificationList.jsx', import.meta.url), 'utf8');
  assert.equal(notificationListFile.includes('hasUnreadNotifications'), true, 'notification UI should keep the unread-dot state');
  assert.equal(notificationListFile.includes('unreadCount'), false, 'numeric unread count helper/badge must not be present');

  userAClient.disconnect();
  userBClient.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 100));
  await new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
});

test('notification service refuses to silently store notifications in memory in production', async () => {
  const userId = new mongoose.Types.ObjectId();
  const previousNodeEnv = process.env.NODE_ENV;
  const previousDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');

  process.env.NODE_ENV = 'production';
  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    enumerable: true,
    get: () => 0,
  });

  await assert.rejects(
    () => createNotificationService({
      userId,
      title: 'Production-safe notification',
      message: 'This write must fail rather than fall back to memory.',
      type: 'system',
    }),
    /MongoDB.*required|notification.*persist|production/i
  );

  process.env.NODE_ENV = previousNodeEnv;
  restoreReadyState(previousDescriptor);
});

test('user A sees only their notifications and user B cannot see them', async () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  const ownedNotification = await createNotificationService({
    userId: userA,
    title: 'User A private notice',
    message: 'Only user A should see this notification.',
    type: 'system',
  });

  await createNotificationService({
    userId: userB,
    title: 'User B private notice',
    message: 'User B should not see user A notifications.',
    type: 'system',
  });

  const userAList = await getUserNotificationsService(userA, { limit: 20 });
  const userBList = await getUserNotificationsService(userB, { limit: 20 });

  assert.ok(userAList.notifications.some((item) => String(item._id) === String(ownedNotification._id)));
  assert.equal(
    userBList.notifications.some((item) => String(item._id) === String(ownedNotification._id)),
    false,
    'user B must not receive user A notification rows'
  );
});

test('user B cannot mark user A notification as read', async () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  const notification = await createNotificationService({
    userId: userA,
    title: 'Protected notification',
    message: 'This one must stay owned by user A.',
    type: 'system',
  });

  const result = await markNotificationReadService(notification._id, userB);

  assert.equal(result.modifiedCount, 0, 'user B should not be able to mark user A notification as read');

  const stored = await NotificationModel.findById(notification._id).lean();
  assert.equal(Boolean(stored?.isRead), false, 'notification must remain unread after user B update attempt');
});

test('user A read-all affects only their notifications', async () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  const userANotification = await createNotificationService({
    userId: userA,
    title: 'A unread 1',
    message: 'User A notification should be marked read.',
    type: 'system',
  });

  const userBNotification = await createNotificationService({
    userId: userB,
    title: 'B unread 1',
    message: 'User B notification should remain unread.',
    type: 'system',
  });

  const result = await markAllNotificationsReadService(userA);

  assert.ok(result.modifiedCount >= 1, 'user A read-all should affect at least one notification');

  const userANotificationAfter = await NotificationModel.findById(userANotification._id).lean();
  const userBNotificationAfter = await NotificationModel.findById(userBNotification._id).lean();

  assert.equal(Boolean(userANotificationAfter?.isRead), true, 'user A notification should be marked read');
  assert.equal(Boolean(userBNotificationAfter?.isRead), false, 'user B notification must remain unread');
});
