import mysql from 'mysql2';

const VALID_PRIVILEGES = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'INDEX', 'EXECUTE', 'REFERENCES']);

export function validateDatabaseName(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error('invalid database name');
  }
  return name;
}

export function parseUserIdentity(input: { user: string; host: string }) {
  if (!input.user || !input.host) {
    throw new Error('invalid user identity');
  }
  return { user: input.user, host: input.host };
}

export function parsePrivilegeList(input: string[]): string[] {
  for (const privilege of input) {
    if (!VALID_PRIVILEGES.has(privilege)) {
      throw new Error(`invalid privilege: ${privilege}`);
    }
  }
  return input;
}

export function formatUserHost(user: string, host: string): string {
  return `${mysql.escape(user)}@${mysql.escape(host)}`;
}
