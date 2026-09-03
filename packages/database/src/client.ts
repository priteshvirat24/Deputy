import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export function createDatabaseClient(connectionUrl: string) {
  const queryClient = postgres(connectionUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Disable prepared statements so the client works through Supabase's
    // Supavisor connection pooler in either session or transaction mode
    // (transaction mode rejects the extended/prepared protocol).
    prepare: false,
  });

  const db = drizzle(queryClient, { schema });
  return { db, queryClient };
}

export type DatabaseInstance = ReturnType<typeof createDatabaseClient>['db'];
