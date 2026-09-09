import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import UserModel from '../src/model/user.model.js';

before(async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured. Set it in backend/.env before running DB-backed tests.');
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
});

after(async () => {
  await mongoose.disconnect();
});

test('normal users can be created without a googleId without colliding on the unique index', async () => {
  const first = await UserModel.create({
    username: `org-reg-${Date.now()}-a`,
    email: `org-reg-${Date.now()}-a@example.com`,
    password: 'StrongPass!123',
    role: 'ORGANIZER',
  });

  const second = await UserModel.create({
    username: `org-reg-${Date.now()}-b`,
    email: `org-reg-${Date.now()}-b@example.com`,
    password: 'StrongPass!123',
    role: 'ORGANIZER',
  });

  assert.ok(first._id);
  assert.ok(second._id);
  assert.equal(first.googleId, undefined);
  assert.equal(second.googleId, undefined);

  await UserModel.findByIdAndDelete(first._id);
  await UserModel.findByIdAndDelete(second._id);
});

test('duplicate organizer registration is rejected when the email matches ignoring case and whitespace', async () => {
  const username = `OrgCase${Date.now()}`;
  const email = `org-case-${Date.now()}@example.com`;

  await UserModel.create({
    username,
    email,
    password: 'StrongPass!123',
    role: 'ORGANIZER',
  });

  await assert.rejects(
    async () => {
      await import('../src/module/auth/auth.service.js').then(({ registerUserService }) =>
        registerUserService({
          username: `${username}-copy`,
          email: `  ${email.toUpperCase()}  `,
          password: 'StrongPass!123',
        }, 'ORGANIZER')
      );
    },
    /User already exists/
  );

  await UserModel.deleteOne({ username, email });
});
