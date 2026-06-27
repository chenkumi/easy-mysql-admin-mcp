import mysql, { type Pool } from 'mysql2/promise';
import { parseAdminConfig } from './config.js';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const config = parseAdminConfig(process.env);

  if (!config.mysql.host || !config.mysql.user || !config.mysql.password || !config.mysql.database) {
    throw new Error('Missing required environment variables for MySQL admin connection.');
  }

  pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: false,
    waitForConnections: config.mysql.waitForConnections,
    connectionLimit: config.mysql.connectionLimit,
    maxIdle: config.mysql.maxIdle,
    idleTimeout: config.mysql.idleTimeout,
    queueLimit: config.mysql.queueLimit,
    enableKeepAlive: config.mysql.enableKeepAlive,
    keepAliveInitialDelay: config.mysql.keepAliveInitialDelay,
  });

  return pool;
}
