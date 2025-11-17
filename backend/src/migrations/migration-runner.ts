/**
 * @summary
 * Database Migration Runner
 * Automatically runs database migrations on application startup
 *
 * @module migrations/migration-runner
 */

import sql from 'mssql';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MigrationConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  encrypt: boolean;
  projectSchema: string;
}

interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: Date;
  checksum: string;
}

export class MigrationRunner {
  private config: sql.config;
  private migrationsPath: string;
  private projectSchema: string;

  constructor(config: MigrationConfig, migrationsPath: string = './migrations') {
    this.config = {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      options: {
        encrypt: config.encrypt,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
    };
    this.migrationsPath = path.resolve(migrationsPath);
    this.projectSchema = config.projectSchema;
  }

  private async createSchemaIfNotExists(pool: sql.ConnectionPool): Promise<void> {
    const createSchemaSQL = `
      IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${this.projectSchema}')
      BEGIN
        EXEC('CREATE SCHEMA [${this.projectSchema}]');
        PRINT 'Schema [${this.projectSchema}] created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Schema [${this.projectSchema}] already exists';
      END
    `;

    await pool.request().query(createSchemaSQL);
    console.log(`✓ Schema [${this.projectSchema}] ready`);
  }

  private async initializeMigrationTable(pool: sql.ConnectionPool): Promise<void> {
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'migrations' AND schema_id = SCHEMA_ID('${this.projectSchema}'))
      BEGIN
        CREATE TABLE [${this.projectSchema}].[migrations] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [filename] NVARCHAR(255) NOT NULL UNIQUE,
          [executed_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          [checksum] NVARCHAR(64) NOT NULL
        );
        PRINT 'Migration tracking table created successfully';
      END
    `;

    await pool.request().query(createTableSQL);
    console.log(`✓ Migration tracking table initialized in [${this.projectSchema}]`);
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async recordMigration(
    pool: sql.ConnectionPool,
    filename: string,
    checksum: string
  ): Promise<void> {
    await pool
      .request()
      .input('filename', sql.NVarChar(255), filename)
      .input('checksum', sql.NVarChar(64), checksum).query(`
        INSERT INTO [${this.projectSchema}].[migrations] (filename, checksum)
        VALUES (@filename, @checksum)
      `);
  }

  private replaceSchemaInSQL(content: string): string {
    let replaced = content.replace(/\[dbo\]\./gi, `[${this.projectSchema}].`);
    replaced = replaced.replace(/\bdbo\./gi, `[${this.projectSchema}].`);
    replaced = replaced.replace(
      /CREATE\s+SCHEMA\s+\[?[\w_]+\]?\s*;?/gi,
      '-- Schema creation removed (managed by migration runner)'
    );
    return replaced;
  }

  private async executeMigration(
    pool: sql.ConnectionPool,
    filename: string,
    content: string
  ): Promise<void> {
    console.log(`\n→ Executing migration: ${filename}`);
    console.log(`  Using schema: [${this.projectSchema}]`);

    const schemaReplacedContent = this.replaceSchemaInSQL(content);
    const batches = schemaReplacedContent
      .split(/^\s*GO\s*$/im)
      .map((batch) => batch.trim())
      .filter((batch) => batch.length > 0);

    console.log(`  Found ${batches.length} SQL batches to execute`);

    for (let i = 0; i < batches.length; i++) {
      try {
        await pool.request().query(batches[i]);
        console.log(`  ✓ Batch ${i + 1}/${batches.length} executed`);
      } catch (error: any) {
        console.error(`  ✗ Batch ${i + 1}/${batches.length} failed:`);
        console.error(`    ${error.message}`);
        throw new Error(`Migration ${filename} failed at batch ${i + 1}: ${error.message}`);
      }
    }

    const checksum = this.calculateChecksum(content);
    await this.recordMigration(pool, filename, checksum);
    console.log(`✓ Migration ${filename} completed successfully`);
  }

  private async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files.filter((f) => f.endsWith('.sql')).sort();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️  Migrations directory not found: ${this.migrationsPath}`);
        console.warn(`   This is normal if no database migrations were generated.`);
      } else {
        console.error(`Error reading migrations directory: ${error.message}`);
      }
      return [];
    }
  }

  private async dropAllTables(pool: sql.ConnectionPool): Promise<void> {
    console.log(`→ Dropping all objects from schema [${this.projectSchema}]...`);
    console.log('  (Other project schemas will NOT be affected)');

    console.log('\n  → Dropping stored procedures...');
    const spResult = await pool.request().query(`
      SELECT SCHEMA_NAME(schema_id) AS schema_name, name
      FROM sys.procedures
      WHERE is_ms_shipped = 0
        AND SCHEMA_NAME(schema_id) = '${this.projectSchema}'
    `);

    for (const sp of spResult.recordset) {
      try {
        await pool.request().query(`
          DROP PROCEDURE [${sp.schema_name}].[${sp.name}]
        `);
        console.log(`    ✓ Dropped SP: ${sp.name}`);
      } catch (error: any) {
        console.warn(`    ⚠️  Failed to drop SP ${sp.name}: ${error.message}`);
      }
    }
    if (spResult.recordset.length === 0) {
      console.log('    ✓ No stored procedures to drop');
    }

    console.log('\n  → Dropping views...');
    const viewResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE TABLE_SCHEMA = '${this.projectSchema}'
    `);

    for (const view of viewResult.recordset) {
      try {
        await pool.request().query(`
          DROP VIEW [${view.TABLE_SCHEMA}].[${view.TABLE_NAME}]
        `);
        console.log(`    ✓ Dropped View: ${view.TABLE_NAME}`);
      } catch (error: any) {
        console.warn(`    ⚠️  Failed to drop View ${view.TABLE_NAME}: ${error.message}`);
      }
    }
    if (viewResult.recordset.length === 0) {
      console.log('    ✓ No views to drop');
    }

    console.log('\n  → Dropping functions...');
    const funcResult = await pool.request().query(`
      SELECT SCHEMA_NAME(schema_id) AS schema_name, name
      FROM sys.objects
      WHERE type IN ('FN', 'IF', 'TF')
        AND is_ms_shipped = 0
        AND SCHEMA_NAME(schema_id) = '${this.projectSchema}'
    `);

    for (const func of funcResult.recordset) {
      try {
        await pool.request().query(`
          DROP FUNCTION [${func.schema_name}].[${func.name}]
        `);
        console.log(`    ✓ Dropped Function: ${func.name}`);
      } catch (error: any) {
        console.warn(`    ⚠️  Failed to drop Function ${func.name}: ${error.message}`);
      }
    }
    if (funcResult.recordset.length === 0) {
      console.log('    ✓ No functions to drop');
    }

    console.log('\n  → Dropping triggers...');
    const triggerResult = await pool.request().query(`
      SELECT
        OBJECT_SCHEMA_NAME(parent_id) AS table_schema,
        OBJECT_NAME(parent_id) AS table_name,
        name AS trigger_name
      FROM sys.triggers
      WHERE is_ms_shipped = 0
        AND parent_id != 0
        AND OBJECT_SCHEMA_NAME(parent_id) = '${this.projectSchema}'
    `);

    for (const trigger of triggerResult.recordset) {
      try {
        await pool.request().query(`
          DROP TRIGGER [${trigger.table_schema}].[${trigger.trigger_name}]
        `);
        console.log(`    ✓ Dropped Trigger: ${trigger.trigger_name}`);
      } catch (error: any) {
        console.warn(`    ⚠️  Failed to drop Trigger ${trigger.trigger_name}: ${error.message}`);
      }
    }
    if (triggerResult.recordset.length === 0) {
      console.log('    ✓ No triggers to drop');
    }

    console.log('\n  → Dropping tables...');
    const tableResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_SCHEMA = '${this.projectSchema}'
        AND TABLE_NAME != 'migrations'
    `);

    const tables = tableResult.recordset;

    if (tables.length === 0) {
      console.log('    ✓ No existing tables to drop');
    } else {
      console.log(`    Found ${tables.length} tables to drop`);

      const fkResult = await pool.request().query(`
        SELECT
          fk.name AS constraint_name,
          OBJECT_SCHEMA_NAME(fk.parent_object_id) AS table_schema,
          OBJECT_NAME(fk.parent_object_id) AS table_name
        FROM sys.foreign_keys fk
        WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) = '${this.projectSchema}'
      `);

      for (const fk of fkResult.recordset) {
        try {
          await pool.request().query(`
            ALTER TABLE [${fk.table_schema}].[${fk.table_name}] DROP CONSTRAINT [${fk.constraint_name}]
          `);
          console.log(`    ✓ Dropped FK constraint: ${fk.constraint_name}`);
        } catch (error: any) {
          console.warn(
            `    ⚠️  Failed to drop FK constraint ${fk.constraint_name}: ${error.message}`
          );
        }
      }

      for (const table of tables) {
        try {
          await pool.request().query(`
            DROP TABLE [${table.TABLE_SCHEMA}].[${table.TABLE_NAME}]
          `);
          console.log(`    ✓ Dropped table: ${table.TABLE_NAME}`);
        } catch (error: any) {
          console.error(`    ✗ Failed to drop table ${table.TABLE_NAME}: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\n✓ All objects from [${this.projectSchema}] dropped successfully\n`);
  }

  async runMigrations(): Promise<void> {
    console.log('\n========================================');
    console.log('DATABASE MIGRATION RUNNER (SCHEMA ISOLATION MODE)');
    console.log('========================================\n');
    console.log(`Project Schema: [${this.projectSchema}]`);
    console.log('Other project schemas will NOT be affected\n');

    let pool: sql.ConnectionPool | null = null;

    try {
      console.log('→ Connecting to database...');
      pool = await sql.connect(this.config);
      console.log('✓ Database connection established\n');

      await this.createSchemaIfNotExists(pool);
      await this.initializeMigrationTable(pool);

      const migrationFiles = await this.getMigrationFiles();
      console.log(`→ Found ${migrationFiles.length} migration files\n`);

      if (migrationFiles.length === 0) {
        console.log('✓ No migrations to run\n');
        return;
      }

      console.log(`🔥 REPLACE MODE: Dropping all objects from [${this.projectSchema}]...\n`);
      await this.dropAllTables(pool);

      console.log(`→ Clearing migration history for [${this.projectSchema}]...`);
      await pool.request().query(`DELETE FROM [${this.projectSchema}].[migrations]`);
      console.log('✓ Migration history cleared\n');

      console.log(`→ Running ${migrationFiles.length} migrations in [${this.projectSchema}]...\n`);

      for (const filename of migrationFiles) {
        const filePath = path.join(this.migrationsPath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        await this.executeMigration(pool, filename, content);
      }

      console.log('\n========================================');
      console.log('✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
      console.log(`✓ SCHEMA [${this.projectSchema}] RECREATED FROM SCRATCH`);
      console.log('✓ OTHER PROJECT SCHEMAS REMAIN UNTOUCHED');
      console.log('========================================\n');
    } catch (error: any) {
      console.error('\n========================================');
      console.error('✗ MIGRATION FAILED');
      console.error('========================================');
      console.error(`Error: ${error.message}\n`);
      throw error;
    } finally {
      if (pool) {
        await pool.close();
        console.log('→ Database connection closed\n');
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const pool = await sql.connect(this.config);
      await pool.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export async function runDatabaseMigrations(options?: {
  skipIfNoNewMigrations?: boolean;
  logLevel?: 'silent' | 'minimal' | 'verbose';
}): Promise<void> {
  const skipIfNoNewMigrations = options?.skipIfNoNewMigrations ?? true;
  const logLevel = options?.logLevel ?? 'minimal';

  if (process.env.SKIP_MIGRATIONS === 'true') {
    if (logLevel !== 'silent') {
      console.log('ℹ️  Migrations skipped (SKIP_MIGRATIONS=true)');
    }
    return;
  }

  const requiredEnvVars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'PROJECT_ID'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    const error = `Missing required database environment variables: ${missingVars.join(', ')}`;
    console.error('❌ Migration Configuration Error:');
    console.error(`   ${error}`);
    console.error('\n   Please ensure the following environment variables are configured:');
    console.error('   - DB_SERVER (e.g., your-server.database.windows.net)');
    console.error('   - DB_NAME (e.g., your-database)');
    console.error('   - DB_USER (e.g., your-admin-user)');
    console.error('   - DB_PASSWORD (your database password)');
    console.error('   - PROJECT_ID (e.g., 1757 - used to create schema name)');
    console.error('   - DB_PORT (optional, defaults to 1433)');
    console.error('   - DB_ENCRYPT (optional, defaults to false)\n');
    throw new Error(error);
  }

  const projectId = process.env.PROJECT_ID!;
  const projectSchema = `project_${projectId}`;

  const config: MigrationConfig = {
    server: process.env.DB_SERVER!,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    encrypt: process.env.DB_ENCRYPT === 'true',
    projectSchema: projectSchema,
  };

  const migrationsPath = process.env.MIGRATIONS_PATH || path.join(__dirname, '../../migrations');
  const runner = new MigrationRunner(config, migrationsPath);
  const migrationFiles = await runner['getMigrationFiles']();

  if (migrationFiles.length === 0) {
    if (logLevel === 'verbose') {
      console.log('✓ No migration files found - skipping migration');
    }
    return;
  }

  if (logLevel !== 'silent') {
    console.log(
      `🔥 Running migrations in SCHEMA ISOLATION mode (schema [${projectSchema}] will be recreated)`
    );
    console.log('   Other project schemas will NOT be affected');
  }

  await runner.runMigrations();
}
