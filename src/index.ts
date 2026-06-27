#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { parseAdminConfig } from './config.js';
import { createConfirmationStore } from './confirmationStore.js';
import { getPool } from './db.js';
import { createAdminHandlers } from './toolHandlers.js';

const config = parseAdminConfig(process.env);
const store = createConfirmationStore({ defaultTtlMs: config.tokenTtlSeconds * 1000 });
getPool();
const handlers = createAdminHandlers(store, config.tokenTtlSeconds);

const server = new McpServer({
  name: 'easy-mysql-admin-mcp',
  version: '0.1.0',
  description: `MySQL Admin: ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
});

server.registerTool(
  'mysql_list_databases',
  {
    description: 'List databases in the current MySQL instance.',
    inputSchema: z.object({}),
  },
  async (): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.listDatabases(), null, 2) }],
  })
);

server.registerTool(
  'mysql_create_database',
  {
    description: 'Create a database.',
    inputSchema: z.object({
      database: z.string().min(1),
    }),
  },
  async ({ database }: { database: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.createDatabase(database), null, 2) }],
  })
);

server.registerTool(
  'mysql_describe_database',
  {
    description: 'Inspect a database definition.',
    inputSchema: z.object({
      database: z.string().min(1),
    }),
  },
  async ({ database }: { database: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.describeDatabase(database), null, 2) }],
  })
);

server.registerTool(
  'mysql_drop_database',
  {
    description: 'Request database deletion and return a short-lived confirmation token.',
    inputSchema: z.object({
      database: z.string().min(1),
    }),
  },
  async ({ database }: { database: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.dropDatabase(database), null, 2) }],
  })
);

server.registerTool(
  'mysql_list_users',
  {
    description: 'List MySQL users.',
    inputSchema: z.object({}),
  },
  async (): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.listUsers(), null, 2) }],
  })
);

server.registerTool(
  'mysql_create_user',
  {
    description: 'Create a MySQL user.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
      password: z.string().min(1),
    }),
  },
  async ({ user, host, password }: { user: string; host: string; password: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.createUser({ user, host, password }), null, 2) }],
  })
);

server.registerTool(
  'mysql_alter_user_password',
  {
    description: 'Change a MySQL user password.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
      password: z.string().min(1),
    }),
  },
  async ({ user, host, password }: { user: string; host: string; password: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.alterUserPassword({ user, host, password }), null, 2) }],
  })
);

server.registerTool(
  'mysql_grant_privileges',
  {
    description: 'Grant privileges on a database to a user.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
      database: z.string().min(1),
      privileges: z.array(z.string().min(1)).min(1),
      withGrantOption: z.boolean().optional(),
    }),
  },
  async ({ user, host, database, privileges, withGrantOption }: { user: string; host: string; database: string; privileges: string[]; withGrantOption?: boolean }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.grantPrivileges({ user, host, database, privileges, withGrantOption }), null, 2) }],
  })
);

server.registerTool(
  'mysql_revoke_privileges',
  {
    description: 'Revoke privileges on a database from a user.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
      database: z.string().min(1),
      privileges: z.array(z.string().min(1)).min(1),
    }),
  },
  async ({ user, host, database, privileges }: { user: string; host: string; database: string; privileges: string[] }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.revokePrivileges({ user, host, database, privileges }), null, 2) }],
  })
);

server.registerTool(
  'mysql_show_grants',
  {
    description: 'Show grants for a user.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
    }),
  },
  async ({ user, host }: { user: string; host: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.showGrants({ user, host }), null, 2) }],
  })
);

server.registerTool(
  'mysql_drop_user',
  {
    description: 'Request user deletion and return a short-lived confirmation token.',
    inputSchema: z.object({
      user: z.string().min(1),
      host: z.string().min(1),
    }),
  },
  async ({ user, host }: { user: string; host: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.dropUser({ user, host }), null, 2) }],
  })
);

server.registerTool(
  'mysql_confirm_task',
  {
    description: 'Confirm and execute a previously issued destructive action token.',
    inputSchema: z.object({
      token: z.string().min(1),
    }),
  },
  async ({ token }: { token: string }): Promise<{ content: { type: 'text'; text: string }[] }> => ({
    content: [{ type: 'text', text: JSON.stringify(await handlers.confirmTask(token), null, 2) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('easy-mysql-admin-mcp running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
