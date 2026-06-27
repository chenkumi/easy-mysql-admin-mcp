import mysql from 'mysql2';
import { getPool } from './db.js';
import type { ConfirmationStore } from './confirmationStore.js';
import { formatUserHost, parsePrivilegeList, parseUserIdentity, validateDatabaseName } from './validation.js';

export type ErrorPayload = {
  error: string;
  code?: string;
};

export type DatabaseRecord = {
  name: string;
  defaultCharacterSetName: string | null;
  defaultCollationName: string | null;
};

export type UserRecord = {
  user: string;
  host: string;
};

export function formatError(error: unknown, code = 'ADMIN_OPERATION_FAILED'): ErrorPayload {
  return {
    error: error instanceof Error ? error.message : String(error),
    code,
  };
}

export function createAdminHandlers(store: ConfirmationStore, tokenTtlSeconds: number) {
  const pool = getPool();

  return {
    listDatabases: async () => {
      const [rows] = await pool.execute(`
        SELECT schema_name AS name, default_character_set_name AS defaultCharacterSetName, default_collation_name AS defaultCollationName
        FROM information_schema.schemata
        ORDER BY schema_name
      `);
      return rows as DatabaseRecord[];
    },
    createDatabase: async (database: string) => {
      const safeName = validateDatabaseName(database);
      await pool.execute(`CREATE DATABASE ${pool.escapeId(safeName)}`);
      return { ok: true, database: safeName };
    },
    describeDatabase: async (database: string) => {
      const safeName = validateDatabaseName(database);
      const [rows] = await pool.execute(
        `SELECT schema_name AS name, default_character_set_name AS defaultCharacterSetName, default_collation_name AS defaultCollationName
         FROM information_schema.schemata
         WHERE schema_name = ?`,
        [safeName]
      );
      return rows as DatabaseRecord[];
    },
    dropDatabase: async (database: string) => {
      const safeName = validateDatabaseName(database);
      const token = store.create({ action: 'drop_database', target: safeName });
      return { status: 'confirmation_required', token, expiresInSeconds: tokenTtlSeconds };
    },
    listUsers: async () => {
      const [rows] = await pool.execute(`
        SELECT user, host
        FROM mysql.user
        ORDER BY user, host
      `);
      return rows as UserRecord[];
    },
    createUser: async (input: { user: string; host: string; password: string }) => {
      const { user, host } = parseUserIdentity(input);
      await pool.execute(`CREATE USER ${formatUserHost(user, host)} IDENTIFIED BY ${mysql.escape(input.password)}`);
      return { ok: true, user, host };
    },
    alterUserPassword: async (input: { user: string; host: string; password: string }) => {
      const { user, host } = parseUserIdentity(input);
      await pool.execute(`ALTER USER ${formatUserHost(user, host)} IDENTIFIED BY ${mysql.escape(input.password)}`);
      return { ok: true, user, host };
    },
    grantPrivileges: async (input: { user: string; host: string; database: string; privileges: string[]; withGrantOption?: boolean }) => {
      const identity = parseUserIdentity(input);
      const safeDatabase = validateDatabaseName(input.database);
      const privileges = parsePrivilegeList(input.privileges).join(', ');
      const grantOption = input.withGrantOption ? ' WITH GRANT OPTION' : '';
      await pool.execute(`GRANT ${privileges} ON ${pool.escapeId(safeDatabase)}.* TO ${formatUserHost(identity.user, identity.host)}${grantOption}`);
      return { ok: true, ...identity, database: safeDatabase, privileges: input.privileges, withGrantOption: Boolean(input.withGrantOption) };
    },
    revokePrivileges: async (input: { user: string; host: string; database: string; privileges: string[] }) => {
      const identity = parseUserIdentity(input);
      const safeDatabase = validateDatabaseName(input.database);
      const privileges = parsePrivilegeList(input.privileges).join(', ');
      await pool.execute(`REVOKE ${privileges} ON ${pool.escapeId(safeDatabase)}.* FROM ${formatUserHost(identity.user, identity.host)}`);
      return { ok: true, ...identity, database: safeDatabase, privileges: input.privileges };
    },
    showGrants: async (input: { user: string; host: string }) => {
      const { user, host } = parseUserIdentity(input);
      const [rows] = await pool.execute(`SHOW GRANTS FOR ${formatUserHost(user, host)}`);
      return rows as Array<Record<string, string>>;
    },
    dropUser: async (input: { user: string; host: string }) => {
      const { user, host } = parseUserIdentity(input);
      const token = store.create({ action: 'drop_user', target: `${user}@${host}` });
      return { status: 'confirmation_required', token, expiresInSeconds: tokenTtlSeconds };
    },
    confirmTask: async (token: string) => {
      const task = store.consume(token);
      if (!task) {
        return { status: 'error', error: 'token not found or expired', code: 'TOKEN_INVALID' };
      }

      if (task.action === 'drop_database') {
        await pool.execute(`DROP DATABASE ${pool.escapeId(task.target)}`);
        return { status: 'confirmed', ok: true, action: task.action, target: task.target };
      }

      const [user, host] = task.target.split('@');
      await pool.execute(`DROP USER ${formatUserHost(user, host)}`);
      return { status: 'confirmed', ok: true, action: task.action, target: task.target };
    },
  };
}
