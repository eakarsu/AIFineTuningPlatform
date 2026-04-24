const fs = require('fs');
const path = require('path');
const db = require('./index');

async function initDatabase() {
  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSQL);
    console.log('Database schema created successfully');

    const schemaAdditionsSQL = fs.readFileSync(path.join(__dirname, 'schema-additions.sql'), 'utf8');
    await db.query(schemaAdditionsSQL);
    console.log('Additional schema created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
}

initDatabase();
