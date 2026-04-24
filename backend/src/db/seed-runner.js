const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');

async function seedDatabase() {
  try {
    // Generate proper bcrypt hash for 'admin123'
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Read seed SQL
    let seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    // Replace placeholder hashes with real bcrypt hash
    seedSQL = seedSQL.replace(/\$2a\$10\$PLACEHOLDER_HASH_ADMIN/g, passwordHash);
    seedSQL = seedSQL.replace(/\$2a\$10\$PLACEHOLDER_HASH_USER/g, passwordHash);
    seedSQL = seedSQL.replace(/\$2a\$10\$PLACEHOLDER_HASH_VIEWER/g, passwordHash);

    // First run schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSQL);
    console.log('Schema created/verified');

    // Run additional schema
    const schemaAdditionsSQL = fs.readFileSync(path.join(__dirname, 'schema-additions.sql'), 'utf8');
    await db.query(schemaAdditionsSQL);
    console.log('Additional schema created/verified');

    // Run seed
    await db.query(seedSQL);
    console.log('Seed data inserted successfully');

    // Run additional seed
    const seedAdditionsSQL = fs.readFileSync(path.join(__dirname, 'seed-additions.sql'), 'utf8');
    await db.query(seedAdditionsSQL);
    console.log('Additional seed data inserted successfully');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
