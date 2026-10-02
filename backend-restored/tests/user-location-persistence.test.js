import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import UserModel from '../src/model/user.model.js';
import { getCurrentUserService, updateCurrentUserService } from '../src/module/auth/auth.service.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CRT';

before(async () => {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
});

after(async () => {
  await mongoose.disconnect();
});

test('authenticated user can persist selected location state to backend', async () => {
  const user = await UserModel.create({
    username: `location-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `location-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Location User',
  });

  const updated = await updateCurrentUserService(user._id, {
    fullName: 'Location User',
    email: user.email,
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      isSelected: true,
    },
  });

  assert.equal(updated.location?.state, 'Assam');
  assert.equal(updated.location?.city, 'Guwahati');

  const persisted = await UserModel.findById(user._id).lean();
  assert.equal(persisted.location?.state, 'Assam');
  assert.equal(persisted.location?.city, 'Guwahati');

  await UserModel.findByIdAndDelete(user._id);
});

test('authenticated user can update selected state without changing unrelated profile data', async () => {
  const user = await UserModel.create({
    username: `location-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `location-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Update User',
    phone: '9876543210',
    address: 'Old address, Assam',
  });

  await updateCurrentUserService(user._id, {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      isSelected: true,
    },
  });

  const afterSet = await updateCurrentUserService(user._id, {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    location: {
      country: 'India',
      state: 'Meghalaya',
      city: 'Shillong',
      isSelected: true,
    },
  });

  assert.equal(afterSet.location?.state, 'Meghalaya');
  assert.equal(afterSet.location?.city, 'Shillong');
  assert.equal(afterSet.phone, '9876543210');

  const persisted = await UserModel.findById(user._id).lean();
  assert.equal(persisted.location?.state, 'Meghalaya');
  assert.equal(persisted.phone, '9876543210');

  await UserModel.findByIdAndDelete(user._id);
});

test('location-only update persists Assam using the existing user profile values', async () => {
  const user = await UserModel.create({
    username: `location-only-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `location-only-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Location Only User',
  });

  const updated = await updateCurrentUserService(user._id, {
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      isSelected: true,
    },
  });

  assert.equal(updated.location?.state, 'Assam');
  assert.equal(updated.location?.city, 'Guwahati');
  assert.equal(updated.location?.isSelected, true);

  const persisted = await UserModel.findById(user._id).lean();
  assert.equal(persisted.location?.state, 'Assam');
  assert.equal(persisted.location?.city, 'Guwahati');
  assert.equal(persisted.location?.isSelected, true);

  await UserModel.findByIdAndDelete(user._id);
});

test('current user response exposes selected location state to the backend', async () => {
  const user = await UserModel.create({
    username: `location-current-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `location-current-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'USER',
    fullName: 'Current User',
    location: {
      country: 'India',
      state: 'Assam',
      city: 'Guwahati',
      isSelected: true,
    },
  });

  const current = await getCurrentUserService(user._id);
  assert.equal(current.location?.state, 'Assam');
  assert.equal(current.location?.city, 'Guwahati');

  await UserModel.findByIdAndDelete(user._id);
});
