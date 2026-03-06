const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Facility = sequelize.define('Facility', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Facility name is required'
            }
        }
    },
    sportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sports', // Tên table
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Xóa sport → xóa facilities
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Phone is required'
            }
        }
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Address is required'
            }
        }
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: ''
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
    },
    courtCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    pricePerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0],
                msg: 'Price must be positive'
            }
        }
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: -90,
            max: 90
        }
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: -180,
            max: 180
        }
    },
    pricingSchedule: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
        // Format: [{startTime: "06:00", endTime: "12:00", price: 100000}, ...]
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
    }
}, {
    tableName: 'facilities',
    timestamps: true // createdAt, updatedAt
});

module.exports = Facility;
