import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import UserModel from '../src/model/user.model.js';
import NotificationModel from '../src/model/notification.model.js';
import { createEventService, updateEventService } from '../src/module/event/event.service.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CRT';

before(async () => {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
});

after(async () => {
  await mongoose.disconnect();
});

test('create event notifies only users in the same selected state', async () => {
  const organizer = await UserModel.create({
    username: `org-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `org-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ORGANIZER',
    fullName: 'Organizer',
  });

  const assamUser = await UserModel.create({
    username: `assam-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `assam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Assam User',
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      district: 'Kamrup',
      isSelected: true,
    },
  });

  const otherStateUser = await UserModel.create({
    username: `meghalaya-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `meghalaya-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Meghalaya User',
    location: {
      country: 'India',
      state: 'Meghalaya',
      city: 'Shillong',
      district: 'East Khasi Hills',
      isSelected: true,
    },
  });

  const event = await createEventService(String(organizer._id), {
    title: 'Assam Tech Fest',
    category: 'Technology',
    eventMode: 'Offline',
    state: 'Assam',
    city: 'Guwahati',
    district: 'Kamrup',
    location: 'Guwahati, Assam',
  });

  const assamNotifications = await NotificationModel.find({
    userId: String(assamUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  const otherStateNotifications = await NotificationModel.find({
    userId: String(otherStateUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  assert.equal(assamNotifications.length, 1, 'same-state user should receive the new event notification');
  assert.equal(otherStateNotifications.length, 0, 'different-state user should not receive the notification');

  await UserModel.findByIdAndDelete(organizer._id);
  await UserModel.findByIdAndDelete(assamUser._id);
  await UserModel.findByIdAndDelete(otherStateUser._id);
});

test('create event does not notify users without selected state or admin users', async () => {
  const organizer = await UserModel.create({
    username: `org-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `org-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ORGANIZER',
    fullName: 'Organizer',
  });

  const adminUser = await UserModel.create({
    username: `admin-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ADMIN',
    fullName: 'Admin',
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      isSelected: true,
    },
  });

  const noStateUser = await UserModel.create({
    username: `nostate-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `nostate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'No State User',
    location: {
      country: 'India',
      state: 'India',
      city: 'All India',
      isSelected: false,
    },
  });

  const event = await createEventService(String(organizer._id), {
    title: 'Assam Create Admin Check',
    category: 'Technology',
    eventMode: 'Offline',
    state: 'Assam',
    city: 'Guwahati',
    location: 'Guwahati, Assam',
  });

  const adminNotifications = await NotificationModel.find({
    userId: String(adminUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  const noStateNotifications = await NotificationModel.find({
    userId: String(noStateUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  assert.equal(adminNotifications.length, 0, 'admin should never receive organizer event notifications');
  assert.equal(noStateNotifications.length, 0, 'user without selected state should not receive a state-targeted notification');

  await UserModel.findByIdAndDelete(organizer._id);
  await UserModel.findByIdAndDelete(adminUser._id);
  await UserModel.findByIdAndDelete(noStateUser._id);
});

test('update event with same state notifies the same state only once', async () => {
  const organizer = await UserModel.create({
    username: `org-update-same-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `org-update-same-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ORGANIZER',
    fullName: 'Organizer',
  });

  const event = await createEventService(String(organizer._id), {
    title: 'Same State Update Event',
    category: 'Technology',
    eventMode: 'Offline',
    state: 'Assam',
    city: 'Guwahati',
    location: 'Guwahati, Assam',
  });

  const assamUser = await UserModel.create({
    username: `assam-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `assam-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Assam Updater',
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      isSelected: true,
    },
  });

  await updateEventService(String(organizer._id), String(event._id), {
    title: 'Same State Update Event',
    state: 'Assam',
  });

  const notifications = await NotificationModel.find({
    userId: String(assamUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  assert.equal(notifications.length, 1, 'same-state update should notify only once for the target user');

  await UserModel.findByIdAndDelete(organizer._id);
  await UserModel.findByIdAndDelete(assamUser._id);
});

test('update event notifies both old-state and new-state users without notifying other states', async () => {
  const organizer = await UserModel.create({
    username: `org-update-state-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `org-update-state-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ORGANIZER',
    fullName: 'Organizer',
  });

  const event = await createEventService(String(organizer._id), {
    title: 'State Move Event',
    category: 'Technology',
    eventMode: 'Offline',
    state: 'Assam',
    city: 'Guwahati',
    location: 'Guwahati, Assam',
  });

  const assamUser = await UserModel.create({
    username: `assam-old-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `assam-old-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Assam Old User',
    location: { country: 'India', state: 'Assam', city: 'Guwahati', isSelected: true },
  });

  const meghalayaUser = await UserModel.create({
    username: `meghalaya-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `meghalaya-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Meghalaya New User',
    location: { country: 'India', state: 'Meghalaya', city: 'Shillong', isSelected: true },
  });

  const nagalandUser = await UserModel.create({
    username: `nagaland-other-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `nagaland-other-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Nagaland Other User',
    location: { country: 'India', state: 'Nagaland', city: 'Kohima', isSelected: true },
  });

  await updateEventService(String(organizer._id), String(event._id), {
    title: 'State Move Event',
    state: 'Meghalaya',
    city: 'Shillong',
    location: 'Shillong, Meghalaya',
  });

  const assamNotifications = await NotificationModel.find({
    userId: String(assamUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  const meghalayaNotifications = await NotificationModel.find({
    userId: String(meghalayaUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  const nagalandNotifications = await NotificationModel.find({
    userId: String(nagalandUser._id),
    'metadata.eventId': String(event._id),
  }).lean();

  assert.equal(assamNotifications.length >= 1, true, 'old-state users should receive the state-update notification');
  assert.equal(meghalayaNotifications.length >= 1, true, 'new-state users should receive the new-state notification');
  assert.equal(nagalandNotifications.length, 0, 'other states should not receive any notification');

  await UserModel.findByIdAndDelete(organizer._id);
  await UserModel.findByIdAndDelete(assamUser._id);
  await UserModel.findByIdAndDelete(meghalayaUser._id);
  await UserModel.findByIdAndDelete(nagalandUser._id);
});
