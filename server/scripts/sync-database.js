/**
 * Script để sync database với MySQL
 * Chạy: node scripts/sync-database.js
 */

const { sequelize, syncDatabase } = require('../models');

const sync = async () => {
    try {
        console.log('🔄 Connecting to MySQL...');
        await sequelize.authenticate();
        console.log('✅ MySQL connection established');

        console.log('\n🔄 Syncing database schema...');

        // Options:
        // { force: true } - DROP all tables and recreate (XÓA DATA!)
        // { alter: true } - Modify tables to match models (safer)
        // {} - Only create tables if they don't exist

        const syncOption = process.argv[2];

        if (syncOption === '--force') {
            console.log('⚠️  WARNING: Using --force will DROP all tables and DATA!');
            await syncDatabase({ force: true });
            console.log('✅ Database synced with FORCE (all tables recreated)');
        } else if (syncOption === '--alter') {
            await syncDatabase({ alter: true });
            console.log('✅ Database synced with ALTER (tables modified)');
        } else {
            await syncDatabase();
            console.log('✅ Database synced (tables created if not exist)');
        }

        console.log('\n📊 Database tables created successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: node seed.js (to add sample data)');
        console.log('2. Start server: npm run dev');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
};

sync();
