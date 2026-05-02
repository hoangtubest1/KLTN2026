const { sequelize } = require('./config/database');

async function fixIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL');

    // Get all tables
    const tables = ['coupons', 'bookings', 'users', 'sports', 'facilities', 'find_mates', 'find_mate_joins', 'news', 'reviews'];
    
    for (const table of tables) {
      try {
        const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name != 'PRIMARY'`);
        const indexNames = [...new Set(indexes.map(r => r.Key_name))];
        
        if (indexNames.length > 10) {
          console.log(`\n⚠️ Table ${table} has ${indexNames.length} non-primary indexes. Cleaning duplicates...`);
          
          // Group by Column_name to find duplicates
          const byColumn = {};
          for (const idx of indexes) {
            if (!byColumn[idx.Column_name]) byColumn[idx.Column_name] = [];
            if (!byColumn[idx.Column_name].includes(idx.Key_name)) {
              byColumn[idx.Column_name].push(idx.Key_name);
            }
          }
          
          for (const [col, keys] of Object.entries(byColumn)) {
            if (keys.length > 1) {
              // Keep the first, drop the rest
              for (let i = 1; i < keys.length; i++) {
                console.log(`  Dropping duplicate index: ${keys[i]} (column: ${col})`);
                try {
                  await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${keys[i]}\``);
                } catch (e) {
                  console.log(`    Skip: ${e.message}`);
                }
              }
            }
          }
        } else {
          console.log(`✅ Table ${table}: ${indexNames.length} indexes (OK)`);
        }
      } catch (e) {
        if (e.message.includes("doesn't exist")) {
          console.log(`⏭️ Table ${table} doesn't exist, skipping`);
        } else {
          console.log(`❌ Error checking ${table}:`, e.message);
        }
      }
    }

    console.log('\n✅ Done!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

fixIndexes();
