const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');

process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

let testDb;
let testPool;

async function setupTestDatabase() {
  try {
    testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'pack_challenge_test',
    });

    testDb = new Kysely({
      dialect: new PostgresDialect({
        pool: testPool,
      }),
    });

    await testDb.schema
      .createTable('resources')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('title', 'varchar(200)', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('category', 'varchar(50)')
      .addColumn('language', 'varchar(50)') 
      .addColumn('provider', 'varchar(50)')
      .addColumn('role', 'varchar(50)')
      .addColumn('file_name', 'varchar(255)', (col) => col.notNull())
      .addColumn('file_path', 'text', (col) => col.notNull())
      .addColumn('s3_key', 'text')
      .addColumn('s3_bucket', 'varchar(100)')
      .addColumn('file_size', 'integer')
      .addColumn('mime_type', 'varchar(100)')
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()').notNull())
      .addColumn('updated_at', 'timestamp', (col) => col.defaultTo('now()').notNull())
      .execute();

    return testDb;
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

async function cleanupTestDatabase() {
  if (testDb) {
    try {
      await testDb.deleteFrom('resources').execute();
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
    }
  }
}

async function closeTestDatabase() {
  if (testPool) {
    await testPool.end();
  }
}

function getTestDb() {
  return testDb;
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDb
};