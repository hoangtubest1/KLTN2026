require('dotenv').config();
const { sequelize } = require('./config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    const tableInfo = await sequelize.query("SHOW COLUMNS FROM find_mates LIKE 'isApproved'", { type: QueryTypes.SELECT });
    if (tableInfo.length === 0) {
      console.log('Adding isApproved column...');
      await sequelize.query("ALTER TABLE find_mates ADD COLUMN isApproved BOOLEAN DEFAULT false");
      console.log('Column added successfully.');
    } else {
      console.log('Column isApproved already exists.');
    }
    
    // Auto-approve existing posts
    await sequelize.query("UPDATE find_mates SET isApproved = true WHERE isApproved = false");
    console.log('All existing posts set to approved.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}
migrate();
