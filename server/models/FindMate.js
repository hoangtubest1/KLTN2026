const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FindMate = sequelize.define('FindMate', {
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
    allowNull: true, // Không bắt buộc — user có thể nhập địa chỉ tự do
    references: {
      model: 'facilities',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tiêu đề là bắt buộc' },
      len: { args: [5, 200], msg: 'Tiêu đề phải từ 5 đến 200 ký tự' }
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
    defaultValue: 1 // Chủ bài tính là 1
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true // Dùng khi không chọn facility
  },
  skillLevel: {
    type: DataTypes.ENUM('any', 'beginner', 'intermediate', 'advanced'),
    defaultValue: 'any',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'full', 'closed', 'expired'),
    defaultValue: 'open',
    allowNull: false
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'find_mates',
  timestamps: true,
  indexes: [
    { fields: ['date'] },
    { fields: ['sportId'] },
    { fields: ['status'] },
    { fields: ['userId'] }
  ]
});

module.exports = FindMate;
