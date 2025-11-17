/**
 * @summary
 * Application configuration management
 * Centralizes all environment-based configuration settings
 *
 * @module config
 */

import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'stockbox',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.NODE_ENV === 'development',
      enableArithAbort: true,
    },
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10),
    version: process.env.API_VERSION || 'v1',
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.CORS_ORIGINS?.split(',') || []
          : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400,
    },
  },
  project: {
    id: process.env.PROJECT_ID || '1757',
    schema: `project_${process.env.PROJECT_ID || '1757'}`,
  },
  migrations: {
    skip: process.env.SKIP_MIGRATIONS === 'true',
    path: process.env.MIGRATIONS_PATH || './migrations',
  },
};
