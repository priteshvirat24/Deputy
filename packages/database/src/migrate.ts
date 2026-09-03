import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { getEnv } from '@deputy/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const env = getEnv();
  console.info(`Connecting to database at ${env.DATABASE_URL.replace(/:\/\/.*@/, '://***@')}...`);

  const sql = postgres(env.DATABASE_URL, { max: 1 });

  try {
    const migrationPath = join(__dirname, '../migrations/0000_initial.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');

    console.info('Applying migration: 0000_initial.sql...');
    await sql.unsafe(migrationSql);
    console.info('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
