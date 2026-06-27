export type AdminConfig = {
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
    maxIdle: number;
    idleTimeout: number;
    queueLimit: number;
    waitForConnections: boolean;
    enableKeepAlive: boolean;
    keepAliveInitialDelay: number;
  };
  tokenTtlSeconds: number;
};

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseBoolean(value: string | undefined, defaultValue = true): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() !== 'false';
}

export function parseAdminConfig(env: NodeJS.ProcessEnv): AdminConfig {
  return {
    mysql: {
      host: env.MYSQL_HOST ?? '',
      port: parsePositiveInt(env.MYSQL_PORT, 3306),
      user: env.MYSQL_USER ?? '',
      password: env.MYSQL_PASSWORD ?? '',
      database: env.MYSQL_DATABASE ?? '',
      connectionLimit: parsePositiveInt(env.MYSQL_CONNECTION_LIMIT, 10),
      maxIdle: parsePositiveInt(env.MYSQL_MAX_IDLE, 10),
      idleTimeout: parsePositiveInt(env.MYSQL_IDLE_TIMEOUT, 60000),
      queueLimit: env.MYSQL_QUEUE_LIMIT ? Number.parseInt(env.MYSQL_QUEUE_LIMIT, 10) : 0,
      waitForConnections: parseBoolean(env.MYSQL_WAIT_FOR_CONNECTIONS, true),
      enableKeepAlive: parseBoolean(env.MYSQL_ENABLE_KEEP_ALIVE, true),
      keepAliveInitialDelay: env.MYSQL_KEEP_ALIVE_INITIAL_DELAY ? Number.parseInt(env.MYSQL_KEEP_ALIVE_INITIAL_DELAY, 10) : 0,
    },
    tokenTtlSeconds: parsePositiveInt(env.MYSQL_ADMIN_TOKEN_TTL_SECONDS, 120),
  };
}
