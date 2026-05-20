const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Sport = require('./Sport');
const Facility = require('./Facility');
const Booking = require('./Booking');
const Review = require('./Review');
const News = require('./News');
const Coupon = require('./Coupon');
const Notification = require('./Notification');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const TeamMessage = require('./TeamMessage');

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

// User (Owner) ↔ Facility (One-to-Many)
// Một chủ sân có thể sở hữu nhiều sân
User.hasMany(Facility, {
    foreignKey: 'ownerId',
    as: 'ownedFacilities',
    onDelete: 'SET NULL'
});
Facility.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
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

// ── Notification (Thông báo) ──
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Team (Đội nhóm cố định) ──
// User ↔ Team (One-to-Many) — Đội trưởng
User.hasMany(Team, { foreignKey: 'userId', as: 'teams', onDelete: 'CASCADE' });
Team.belongsTo(User, { foreignKey: 'userId', as: 'captain' });

// Sport ↔ Team (One-to-Many)
Sport.hasMany(Team, { foreignKey: 'sportId', as: 'teams', onDelete: 'RESTRICT' });
Team.belongsTo(Sport, { foreignKey: 'sportId', as: 'sport' });

// Team ↔ TeamMember (One-to-Many)
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// User ↔ TeamMember (One-to-Many)
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'teamMemberships', onDelete: 'CASCADE' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── TeamMessage (Tin nhắn đội) ──
Team.hasMany(TeamMessage, { foreignKey: 'teamId', as: 'messages', onDelete: 'CASCADE' });
TeamMessage.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

User.hasMany(TeamMessage, { foreignKey: 'userId', as: 'teamMessages', onDelete: 'CASCADE' });
TeamMessage.belongsTo(User, { foreignKey: 'userId', as: 'sender' });

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
    Coupon,
    Notification,
    Team,
    TeamMember,
    TeamMessage,
    syncDatabase
};
