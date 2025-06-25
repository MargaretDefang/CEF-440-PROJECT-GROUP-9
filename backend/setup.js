const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'road_app_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'agogomillion',
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');

    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Create admin user
    const adminEmail = 'admin@roadapp.com';
    const adminPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, user_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [adminEmail, passwordHash, 'Admin', 'User', 'admin']
      );
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 