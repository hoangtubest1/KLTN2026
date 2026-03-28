const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Sport = require('./Sport');
const Facility = require('./Facility');
const Booking = require('./Booking');
const Review = require('./Review');
const News = require('./News');

// ============================================
// DEFINE RELATIONSHIPS (ASSOCIATIONS)
// ============================================

// Sport ↔ Facility (One-to-Many)
// Một Sport có nhiều Facilities
Sport.hasMany(Facility, {
    foreignKey: 'sportId',
    as: 'facilities', // Alias khi query
    onDelete: 'CASCADE' // Xóa sport → xóa facilities
});

Facility.belongsTo(Sport, {
    foreignKey: 'sportId',
    as: 'sport'
});

// Sport ↔ Booking (One-to-Many)
// Một Sport có nhiều Bookings
Sport.hasMany(Booking, {
    foreignKey: 'sportId',
    as: 'bookings',
    onDelete: 'RESTRICT' // Không cho xóa sport nếu có booking
});

Booking.belongsTo(Sport, {
    foreignKey: 'sportId',
    as: 'sport'
});

// User ↔ Review (One-to-Many)
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Facility ↔ Review (One-to-Many)
Facility.hasMany(Review, { foreignKey: 'facilityId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });

// ============================================
// SYNC DATABASE
// ============================================

/**
 * Sync all models với database
 * @param {Object} options - Sequelize sync options
 * @returns {Promise}
 */
const syncDatabase = async (options = {}) => {
    try {
        // options có thể là:
        // { force: true } - DROP tất cả tables và tạo lại (XÓA DATA!)
        // { alter: true } - Modify tables để match models (an toàn hơn)
        // {} - Chỉ tạo tables nếu chưa tồn tại

        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully');
    } catch (error) {
        console.error('❌ Database sync error:', error);
        throw error;
    }
};

// Export models và functions
module.exports = {
    sequelize,
    User,
    Sport,
    Facility,
    Booking,
    Review,
    News,
    syncDatabase
};
