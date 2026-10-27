import test from 'node:test';
import assert from 'node:assert/strict';

import { validateLoginForm } from './loginValidation.js';

test('empty or whitespace fields are rejected', () => {
  assert.equal(validateLoginForm({ email: '', password: '' }), 'Email and password are required');
  assert.equal(validateLoginForm({ email: '  ', password: 'x' }), 'Email is required');
  assert.equal(validateLoginForm({ email: 'a@b.c', password: '   ' }), 'Password is required');
});

test('filled form is accepted', () => {
  assert.equal(validateLoginForm({ email: 'a@b.c', password: 'x' }), '');
});
