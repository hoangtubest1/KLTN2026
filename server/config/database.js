const { Sequelize } = require('sequelize');
require('dotenv').config();

// Tạo Sequelize instance với MySQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'sports_booking',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'root',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false, // Tắt SQL logs (bật = console.log để debug)

        // Connection pool configuration
        pool: {
            max: 5,        // Số connection tối đa
            min: 0,        // Số connection tối thiểu
            acquire: 30000, // Thời gian tối đa để lấy connection (ms)
            idle: 10000    // Thời gian tối đa connection không hoạt động (ms)
        },

        // Timezone configuration
        timezone: '+07:00', // Việt Nam timezone

        // Define default options cho tất cả models
        define: {
            timestamps: true,      // Tự động thêm createdAt, updatedAt
            underscored: false,    // Dùng camelCase thay vì snake_case
            freezeTableName: false // Cho phép Sequelize pluralize table names
        }
    }
);

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connection established successfully');
    } catch (error) {
        console.error('❌ Unable to connect to MySQL:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, testConnection };
