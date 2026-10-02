import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import { getAdminUsersService, updateAdminUserService } from '../src/module/admin/admin.service.js';
import { getCurrentUserService } from '../src/module/auth/auth.service.js';
import { normalizeAddressForStorage } from '../src/module/profile/profile.service.js';

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

test('getAdminUsersService exists and returns a normalized list', async () => {
  const users = await getAdminUsersService();

  assert.ok(Array.isArray(users), 'users should be an array');
  assert.ok(users.length >= 0, 'users list should be defined');
});

test('getAdminUsersService can filter organizers separately from users', async () => {
  const organizers = await getAdminUsersService('ORGANIZER');
  const users = await getAdminUsersService('USER');
  const admins = await getAdminUsersService('ADMIN');

  assert.ok(Array.isArray(organizers), 'organizers should be an array');
  assert.ok(Array.isArray(users), 'users should be an array');
  assert.ok(Array.isArray(admins), 'admins should be an array');

  const mixedRoleOrganizer = organizers.find((item) =>
    Array.isArray(item.roles) && item.roles.includes('USER') && item.roles.includes('ORGANIZER')
  );

  assert.ok(mixedRoleOrganizer, 'mixed-role organizers should be included in the organizer filter');
  assert.equal(mixedRoleOrganizer.role, 'USER', 'mixed-role organizer should retain USER as the primary role');
  assert.ok(mixedRoleOrganizer.roles.includes('ORGANIZER'), 'mixed-role organizer must still have ORGANIZER access');

  const mixedRoleStillInUserList = users.some((item) =>
    String(item.email).toLowerCase() === String(mixedRoleOrganizer.email).toLowerCase()
  );
  assert.ok(mixedRoleStillInUserList, 'mixed-role organizer should remain in the user list because they are still USER accounts');

  const legacyOrganizer = organizers.find((item) => item.role === 'ORGANIZER');
  assert.ok(legacyOrganizer, 'legacy organizer-only accounts should still be included');

  const adminOnly = admins.find((item) => item.role === 'ADMIN');
  assert.ok(adminOnly, 'admin account records should remain ADMIN');
  assert.ok(organizers.every((item) => !item.role || item.role !== 'ADMIN'), 'admin records should not appear in organizer filter');
  assert.ok(users.every((item) => !item.role || item.role !== 'ADMIN'), 'admin records should not appear in user filter');
});

test('normalizeAddressForStorage combines separate address parts into one stored value', () => {
  assert.equal(
    normalizeAddressForStorage({ address: '123 Main Road', city: 'Jaipur', state: 'Rajasthan' }),
    '123 Main Road, Jaipur, Rajasthan',
  );

  assert.equal(
    normalizeAddressForStorage({ city: 'Jaipur', state: 'Rajasthan' }),
    'Jaipur, Rajasthan',
  );

  assert.equal(
    normalizeAddressForStorage('123 Main Road, Jaipur, Rajasthan'),
    '123 Main Road, Jaipur, Rajasthan',
  );
});

test('google users can be created without a password', async () => {
  const UserModel = (await import('../src/model/user.model.js')).default;

  const user = new UserModel({
    username: `google-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: `google-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: '',
    role: 'USER',
    googleId: `google-${Date.now()}`,
    fullName: 'Google User',
  });

  assert.doesNotThrow(() => user.validateSync(), 'google user should validate without a password');
  assert.equal(String(user.password || ''), '', 'google user password should remain empty');
});

test('admin roleTitle persists through update and current-user retrieval', async () => {
  const UserModel = (await import('../src/model/user.model.js')).default;

  const user = await UserModel.create({
    username: `role-title-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: `role-title-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: 'ADMIN',
    fullName: 'Admin User',
    roleTitle: 'Senior Admin',
  });

  const updated = await updateAdminUserService(user._id, { roleTitle: 'Operations Lead' });
  assert.equal(updated.roleTitle, 'Operations Lead', 'admin roleTitle should persist on update');

  const current = await getCurrentUserService(user._id);
  assert.equal(current.roleTitle, 'Operations Lead', 'current user response should include updated roleTitle');

  await UserModel.findByIdAndDelete(user._id);
});
