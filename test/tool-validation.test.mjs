import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrivilegeList, parseUserIdentity, validateDatabaseName } from '../build/validation.js';

test('database names reject invalid identifiers', () => {
  assert.equal(validateDatabaseName('demo_db'), 'demo_db');
  assert.throws(() => validateDatabaseName('demo db'));
  assert.throws(() => validateDatabaseName('1demo'));
});

test('user identity is split into user and host', () => {
  assert.deepEqual(parseUserIdentity({ user: 'alice', host: '%' }), { user: 'alice', host: '%' });
  assert.throws(() => parseUserIdentity({ user: '', host: '%' }));
});

test('privileges are validated as a closed set', () => {
  assert.deepEqual(parsePrivilegeList(['SELECT', 'INSERT']), ['SELECT', 'INSERT']);
  assert.throws(() => parsePrivilegeList(['DROP TABLE']));
});
