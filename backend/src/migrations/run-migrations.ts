/**
 * @summary
 * Standalone migration runner script
 * Can be run independently or as part of application startup
 *
 * @module migrations/run-migrations
 */

import { runDatabaseMigrations } from './migration-runner';

async function main() {
  try {
    console.log('Starting database migration process...\n');
    await runDatabaseMigrations();
    console.log('Migration process completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration process failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
