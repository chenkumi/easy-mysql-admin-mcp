import test from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmationStore } from '../build/confirmationStore.js';

test('expired tokens cannot be consumed', () => {
  const originalNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;

  try {
    const store = createConfirmationStore({ defaultTtlMs: 1000 });
    const token = store.create({ action: 'drop_database', target: 'demo_db' });

    now += 1001;

    assert.equal(store.consume(token), undefined);
  } finally {
    Date.now = originalNow;
  }
});
