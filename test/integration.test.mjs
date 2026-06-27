import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

loadDotEnv(path.resolve('.env'));

const requiredEnv = ['TEST_HOST', 'TEST_PORT', 'TEST_USERNAME', 'TEST_PASSWORD', 'TEST_DB'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const suffix = Date.now();
const adminDb = `easy_mysql_admin_${suffix}`;
const adminUser = `easy_mysql_admin_${suffix}`;
const adminHost = '%';
const adminPassword = `Pw_${suffix}_!`;

if (missingEnv.length === 0) {
  process.env.MYSQL_HOST = process.env.TEST_HOST;
  process.env.MYSQL_PORT = process.env.TEST_PORT;
  process.env.MYSQL_USER = process.env.TEST_USERNAME;
  process.env.MYSQL_PASSWORD = process.env.TEST_PASSWORD;
  process.env.MYSQL_DATABASE = process.env.TEST_DB;
  process.env.MYSQL_ADMIN_TOKEN_TTL_SECONDS = '120';
}

test('easy-mysql-admin-mcp integration tests', { skip: missingEnv.length > 0 ? `Missing test env: ${missingEnv.join(', ')}` : false }, async (t) => {
  const db = await import('../build/db.js');
  const { createConfirmationStore } = await import('../build/confirmationStore.js');
  const { createAdminHandlers } = await import('../build/toolHandlers.js');

  const store = createConfirmationStore({ defaultTtlMs: 120000 });
  const handlers = createAdminHandlers(store, 120);

  try {
    await cleanupIfExists(db);

    await t.test('create_database', async () => {
      const result = await handlers.createDatabase(adminDb);
      assert.deepEqual(result, { ok: true, database: adminDb });

      const [rows] = await db.getPool().execute(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = ?',
        [adminDb],
      );
      assert.equal(rows.length, 1);
    });

    await t.test('create_user and grant_privileges', async () => {
      const createResult = await handlers.createUser({ user: adminUser, host: adminHost, password: adminPassword });
      assert.deepEqual(createResult, { ok: true, user: adminUser, host: adminHost });

      const grantResult = await handlers.grantPrivileges({
        user: adminUser,
        host: adminHost,
        database: adminDb,
        privileges: ['SELECT', 'INSERT'],
      });
      assert.equal(grantResult.ok, true);
      assert.equal(grantResult.database, adminDb);
      assert.deepEqual(grantResult.privileges, ['SELECT', 'INSERT']);

      const grants = await handlers.showGrants({ user: adminUser, host: adminHost });
      assert.ok(Array.isArray(grants));
      assert.ok(grants.length > 0);
    });

    await t.test('revoke_privileges and alter_user_password', async () => {
      const revokeResult = await handlers.revokePrivileges({
        user: adminUser,
        host: adminHost,
        database: adminDb,
        privileges: ['INSERT'],
      });
      assert.equal(revokeResult.ok, true);

      const passwordResult = await handlers.alterUserPassword({
        user: adminUser,
        host: adminHost,
        password: `${adminPassword}-2`,
      });
      assert.deepEqual(passwordResult, { ok: true, user: adminUser, host: adminHost });
    });

    await t.test('drop_database requires confirm_task', async () => {
      const pending = await handlers.dropDatabase(adminDb);
      assert.equal(pending.status, 'confirmation_required');
      assert.equal(typeof pending.token, 'string');

      const confirmed = await handlers.confirmTask(pending.token);
      assert.equal(confirmed.status, 'confirmed');
      assert.equal(confirmed.action, 'drop_database');
      assert.equal(confirmed.target, adminDb);
    });

    await t.test('drop_user requires confirm_task', async () => {
      const pending = await handlers.dropUser({ user: adminUser, host: adminHost });
      assert.equal(pending.status, 'confirmation_required');
      assert.equal(typeof pending.token, 'string');

      const confirmed = await handlers.confirmTask(pending.token);
      assert.equal(confirmed.status, 'confirmed');
      assert.equal(confirmed.action, 'drop_user');
      assert.equal(confirmed.target, `${adminUser}@${adminHost}`);
    });
  } finally {
    await cleanupIfExists(db);
    await db.getPool().end();
  }
});

async function cleanupIfExists(db) {
  const pool = db.getPool();
  await pool.execute(`DROP USER IF EXISTS '${adminUser}'@'${adminHost}'`);
  await pool.execute(`DROP DATABASE IF EXISTS \`${adminDb}\``);
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseDotEnvValue(trimmed.slice(separatorIndex + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseDotEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}
