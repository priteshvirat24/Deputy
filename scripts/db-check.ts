#!/usr/bin/env tsx
import { getEnv } from '@deputy/config';
import { createDatabaseClient, verifyDatabaseReadiness } from '@deputy/database';

async function runCheck() {
  console.log('=== DEPUTY Database Readiness Inspection ===');
  const env = getEnv();

  console.log(`Repository Mode: ${env.REPOSITORY_MODE}`);
  console.log(`Database URL:    ${env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  if (env.REPOSITORY_MODE === 'MEMORY') {
    console.log('Running in IN-MEMORY development mode. Database checks skipped.');
    process.exit(0);
  }

  try {
    const { db, queryClient } = createDatabaseClient(env.DATABASE_URL);
    const result = await verifyDatabaseReadiness(db);

    console.log(`Database Connected: ${result.connected ? 'YES' : 'NO'}`);
    console.log(`Tables Found (${result.tablesFound.length}): ${result.tablesFound.join(', ')}`);

    if (!result.ready) {
      console.error(`\n[ERROR] Database is NOT ready: ${result.error}`);
      console.error(`Missing Tables: ${result.missingTables.join(', ')}`);
      await queryClient.end();
      process.exit(1);
    }

    console.log('\n[SUCCESS] Database is fully ready with all required tables and relations!');
    await queryClient.end();
    process.exit(0);
  } catch (err: unknown) {
    console.error('\n[FATAL] Database inspection failed:', err);
    process.exit(1);
  }
}

runCheck();
