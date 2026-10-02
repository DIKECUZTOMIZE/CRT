import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import UserModel from '../src/model/user.model.js';
import {
  assertOrganizerAccess,
  organizerHandoffService,
  verifyOrganizerAccess,
} from '../src/module/auth/auth.service.js';

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

test('fresh user registration assigns USER as primary role and includes ORGANIZER in roles', async () => {
  const username = `user-role-${Date.now()}`;
  const email = `user-role-${Date.now()}@example.com`;

  const result = await import('../src/module/auth/auth.service.js').then(({ registerUserService }) =>
    registerUserService({
      username,
      email,
      password: 'StrongPass!123',
    })
  );

  assert.equal(result.user.role, 'USER');
  assert.ok(result.user.roles.includes('USER'));
  assert.ok(result.user.roles.includes('ORGANIZER'));

  const saved = await UserModel.findOne({ email }).lean();
  assert.equal(saved.role, 'USER');
  assert.ok(saved.roles.includes('USER'));
  assert.ok(saved.roles.includes('ORGANIZER'));

  await UserModel.findByIdAndDelete(saved._id);
});

test('fresh organizer registration keeps both USER and ORGANIZER available in the same account', async () => {
  const username = `organizer-role-${Date.now()}`;
  const email = `organizer-role-${Date.now()}@example.com`;

  const result = await import('../src/module/auth/auth.service.js').then(({ registerOrganizerService }) =>
    registerOrganizerService({
      username,
      email,
      password: 'StrongPass!123',
    })
  );

  assert.ok(result.user.roles.includes('USER'));
  assert.ok(result.user.roles.includes('ORGANIZER'));

  const saved = await UserModel.findOne({ email }).lean();
  assert.ok(saved.roles.includes('USER'));
  assert.ok(saved.roles.includes('ORGANIZER'));
  assert.equal(saved.role, 'USER');

  await UserModel.findByIdAndDelete(saved._id);
});

test('google-linked accounts normalize to the unified USER + ORGANIZER role policy', async () => {
  const username = `google-role-${Date.now()}`;
  const email = `google-role-${Date.now()}@example.com`;

  const user = await UserModel.create({
    username,
    email,
    password: 'StrongPass!123',
    role: 'USER',
    roles: ['USER'],
    googleId: `google-${Date.now()}`,
  });

  user.googleId = `google-${Date.now() + 1}`;
  await user.save();

  assert.equal(user.role, 'USER');
  assert.ok(user.roles.includes('USER'));
  assert.ok(user.roles.includes('ORGANIZER'));

  await UserModel.findByIdAndDelete(user._id);
});

test('verifyOrganizerAccess passes when the authenticated user has ORGANIZER in roles', async () => {
  const originalFindById = UserModel.findById;
  UserModel.findById = async () => ({
    _id: 'user-with-organizer',
    role: 'USER',
    roles: ['USER', 'ORGANIZER'],
  });

  try {
    await assert.doesNotReject(async () => {
      const result = await verifyOrganizerAccess('user-with-organizer');
      assert.deepEqual(result, { authorized: true });
    });
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('verifyOrganizerAccess rejects a user who is only USER', async () => {
  const originalFindById = UserModel.findById;
  UserModel.findById = async () => ({
    _id: 'user-without-organizer',
    role: 'USER',
    roles: ['USER'],
  });

  try {
    await assert.rejects(
      () => verifyOrganizerAccess('user-without-organizer'),
      { message: 'Organizer access required' }
    );
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('assertOrganizerAccess throws a not-found error for a missing authenticated user', async () => {
  const originalFindById = UserModel.findById;
  UserModel.findById = async () => null;

  try {
    await assert.rejects(
      () => assertOrganizerAccess('missing-user'),
      /User not found/
    );
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('organizerHandoffService creates organizer session for the current authenticated user when organizer access exists', async () => {
  const originalFindById = UserModel.findById;
  const userId = new mongoose.Types.ObjectId();
  UserModel.findById = async () => ({
    _id: userId,
    username: 'handoff-user',
    email: 'handoff@example.com',
    role: 'USER',
    roles: ['USER', 'ORGANIZER'],
    fullName: 'Handoff User',
    roleTitle: '',
    phone: '',
    address: '',
    avatar: '',
    organizationName: '',
    website: '',
    bio: '',
    location: {},
    isVerified: false,
    kycStatus: '',
    kycDocumentType: '',
    kycVerifiedAt: '',
    socials: { instagram: '', twitter: '', linkedin: '' },
    settings: { emailNotifications: true, publicProfile: true },
    stats: { totalEvents: 0, activeEvents: 0, totalAttendees: '', rating: 0 },
    savedEvents: [],
  });

  try {
    const result = await organizerHandoffService(userId.toString());
    assert.equal(result.authorized, true);
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.equal(result.user.roles.includes('ORGANIZER'), true);
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('organizerHandoffService rejects a user who only has USER role', async () => {
  const originalFindById = UserModel.findById;
  const userId = new mongoose.Types.ObjectId();
  UserModel.findById = async () => ({
    _id: userId,
    username: 'plain-user',
    email: 'plain@example.com',
    role: 'USER',
    roles: ['USER'],
  });

  try {
    await assert.rejects(
      () => organizerHandoffService(userId.toString()),
      { message: 'Organizer access required' }
    );
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('organizerHandoffService accepts organizer access when roles include ORGANIZER and keeps USER as the primary role', async () => {
  const originalFindById = UserModel.findById;
  const userId = new mongoose.Types.ObjectId();
  UserModel.findById = async () => ({
    _id: userId,
    username: 'stale-role-user',
    email: 'stale-role@example.com',
    role: 'USER',
    roles: ['USER', 'ORGANIZER'],
    fullName: 'Stale Role User',
    roleTitle: '',
    phone: '',
    address: '',
    avatar: '',
    organizationName: '',
    website: '',
    bio: '',
    location: {},
    isVerified: false,
    kycStatus: '',
    kycDocumentType: '',
    kycVerifiedAt: '',
    socials: { instagram: '', twitter: '', linkedin: '' },
    settings: { emailNotifications: true, publicProfile: true },
    stats: { totalEvents: 0, activeEvents: 0, totalAttendees: '', rating: 0 },
    savedEvents: [],
  });

  try {
    const result = await organizerHandoffService(userId.toString());
    assert.equal(result.authorized, true);
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.equal(result.user.roles.includes('ORGANIZER'), true);
    assert.equal(result.user.role, 'USER');
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('organizerHandoffService uses the authenticated user account instead of arbitrary email input', async () => {
  const originalFindById = UserModel.findById;
  const userId = new mongoose.Types.ObjectId();
  UserModel.findById = async () => ({
    _id: userId,
    username: 'same-account',
    email: 'abc@example.com',
    role: 'USER',
    roles: ['USER', 'ORGANIZER'],
    fullName: 'Same Account',
    roleTitle: '',
    phone: '',
    address: '',
    avatar: '',
    organizationName: '',
    website: '',
    bio: '',
    location: {},
    isVerified: false,
    kycStatus: '',
    kycDocumentType: '',
    kycVerifiedAt: '',
    socials: { instagram: '', twitter: '', linkedin: '' },
    settings: { emailNotifications: true, publicProfile: true },
    stats: { totalEvents: 0, activeEvents: 0, totalAttendees: '', rating: 0 },
    savedEvents: [],
  });

  try {
    const result = await organizerHandoffService(userId.toString());
    assert.equal(result.user.email, 'abc@example.com');
    assert.equal(result.authorized, true);
  } finally {
    UserModel.findById = originalFindById;
  }
});
