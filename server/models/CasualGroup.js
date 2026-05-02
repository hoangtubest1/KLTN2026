const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const CasualGroup = sequelize.define('CasualGroup', {
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
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  sportId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sports',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  roomCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tên phòng là bắt buộc' },
      len: { args: [3, 200], msg: 'Tên phòng phải từ 3 đến 200 ký tự' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: 'Ngày không hợp lệ' }
    }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: { args: [2], msg: 'Cần ít nhất 2 người' },
      max: { args: [50], msg: 'Tối đa 50 người' }
    }
  },
  currentPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true,
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'full', 'closed', 'expired'),
    defaultValue: 'open',
    allowNull: false
  }
}, {
  tableName: 'casual_groups',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['roomCode'] },
    { fields: ['date'] },
    { fields: ['sportId'] },
    { fields: ['status'] },
    { fields: ['userId'] }
  ],
  hooks: {
    beforeValidate: (group) => {
      // Auto-generate room code: XXXX-XXXX (8 ký tự)
      if (!group.roomCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ O, 0, I, 1 để tránh nhầm
        let code = '';
        const bytes = crypto.randomBytes(8);
        for (let i = 0; i < 8; i++) {
          code += chars[bytes[i] % chars.length];
        }
        group.roomCode = code.slice(0, 4) + '-' + code.slice(4);
      }
    }
  }
});

module.exports = CasualGroup;
