import { sql } from 'drizzle-orm';
import { DatabaseInstance } from './client.js';

export const REQUIRED_DATABASE_TABLES = [
  'actors',
  'demonstrations',
  'demonstration_actions',
  'learned_tools',
  'learned_tool_versions',
  'tool_proposals',
  'authorizations',
  'webauthn_credentials',
  'audit_events',
] as const;

export interface DatabaseReadinessResult {
  ready: boolean;
  connected: boolean;
  tablesFound: string[];
  missingTables: string[];
  error?: string;
}

export async function verifyDatabaseReadiness(
  db: DatabaseInstance,
): Promise<DatabaseReadinessResult> {
  try {
    // 1. Connection check
    await db.execute(sql`SELECT 1`);

    // 2. Table verification query
    const rows = (await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)) as unknown as { table_name: string }[];

    const existingTableNames = new Set(Array.isArray(rows) ? rows.map(r => r.table_name) : []);

    const tablesFound: string[] = [];
    const missingTables: string[] = [];

    for (const table of REQUIRED_DATABASE_TABLES) {
      if (existingTableNames.has(table)) {
        tablesFound.push(table);
      } else {
        missingTables.push(table);
      }
    }

    const ready = missingTables.length === 0;

    return {
      ready,
      connected: true,
      tablesFound,
      missingTables,
      error: ready ? undefined : `Missing required database tables: ${missingTables.join(', ')}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ready: false,
      connected: false,
      tablesFound: [],
      missingTables: [...REQUIRED_DATABASE_TABLES],
      error: `Database connection or inspection failed: ${message}`,
    };
  }
}
