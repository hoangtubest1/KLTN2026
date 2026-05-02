const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FindMateJoin = sequelize.define('FindMateJoin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  findMateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'find_mates',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
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
  message: {
    type: DataTypes.TEXT,
    allowNull: true // Lời nhắn giới thiệu khi đăng ký
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  tableName: 'find_mate_joins',
  timestamps: true,
  indexes: [
    { fields: ['findMateId'] },
    { fields: ['userId'] },
    {
      unique: true,
      fields: ['findMateId', 'userId'] // Mỗi user chỉ đăng ký 1 lần/bài
    }
  ]
});

module.exports = FindMateJoin;
