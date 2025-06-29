const pool = require('./config/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if sign_categories table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sign_categories'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ sign_categories table exists');
      
      // Check if table has data
      const countResult = await pool.query('SELECT COUNT(*) FROM sign_categories');
      console.log('📊 Number of categories:', countResult.rows[0].count);
      
      // Get sample data
      const sampleData = await pool.query('SELECT * FROM sign_categories LIMIT 3');
      console.log('📋 Sample categories:', sampleData.rows);
      
    } else {
      console.log('❌ sign_categories table does not exist');
    }
    
    // Check if road_signs table exists
    const signsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'road_signs'
      );
    `);
    
    if (signsTableCheck.rows[0].exists) {
      console.log('✅ road_signs table exists');
      
      const signsCount = await pool.query('SELECT COUNT(*) FROM road_signs');
      console.log('📊 Number of signs:', signsCount.rows[0].count);
    } else {
      console.log('❌ road_signs table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase(); 