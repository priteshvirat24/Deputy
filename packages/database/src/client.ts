import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export function createDatabaseClient(connectionUrl: string) {
  const queryClient = postgres(connectionUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(queryClient, { schema });
  return { db, queryClient };
}

export type DatabaseInstance = ReturnType<typeof createDatabaseClient>['db'];
