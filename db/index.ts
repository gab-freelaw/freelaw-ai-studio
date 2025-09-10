import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema/index';
import * as legalSchema from './legal-schema';
import * as userSettingsSchema from './user-settings-schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Try direct connection first, fallback to pooler
const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// For migrations and one-time queries
export const migrationClient = postgres(connectionString, { max: 1 });

// For application use with connection pooling
const queryClient = postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Combine all schemas
const allSchemas = { ...schema, ...legalSchema, ...userSettingsSchema };

export const db = drizzle(queryClient, { schema: allSchemas });
export type Database = typeof db;

// Re-export schemas for convenience
export * from './legal-schema';
export * from './user-settings-schema';