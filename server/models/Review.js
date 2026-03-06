const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    facilityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'facilities',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Rating phải từ 1-5' },
            max: { args: [5], msg: 'Rating phải từ 1-5' }
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: 'Bình luận không quá 1000 ký tự' }
        }
    }
}, {
    tableName: 'reviews',
    timestamps: true
});

module.exports = Review;
