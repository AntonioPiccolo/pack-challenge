const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pack_challenge',
});

const db = new Kysely({
  dialect: new PostgresDialect({
    pool,
  }),
});

async function createResourcesTable() {
  try {
    await db.schema
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
    
    console.log('Resources table created successfully')
  } catch (error) {
    console.warn('Table creation skipped:', error.message)
  }
}

module.exports = { db, createResourcesTable };