const fs = require('fs');
const path = require('path');
const db = require('./index');

async function initDatabase() {
  try {
    if (process.env.ALLOW_DATABASE_MIGRATION !== '1' && process.env.ALLOW_SCHEMA_MIGRATION !== '1') {
      throw new Error('Refusing schema mutation without ALLOW_DATABASE_MIGRATION=1 or ALLOW_SCHEMA_MIGRATION=1');
    }
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSQL);
    console.log('Database schema created successfully');

    const schemaAdditionsSQL = fs.readFileSync(path.join(__dirname, 'schema-additions.sql'), 'utf8');
    await db.query(schemaAdditionsSQL);
    console.log('Additional schema created successfully');
    const governedSQL = fs.readFileSync(path.join(__dirname, 'schema-governed.sql'), 'utf8');
    await db.query(governedSQL);
    console.log('Governed lifecycle schema created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
}

initDatabase();
