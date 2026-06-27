import test from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmationStore } from '../build/confirmationStore.js';

test('consume returns the task once and then removes it', () => {
  const store = createConfirmationStore({ defaultTtlMs: 120000 });
  const token = store.create({
    action: 'drop_database',
    target: 'demo_db',
  });

  const first = store.consume(token);
  const second = store.consume(token);

  assert.equal(first?.action, 'drop_database');
  assert.equal(first?.target, 'demo_db');
  assert.equal(second, undefined);
});
