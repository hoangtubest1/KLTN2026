const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tên đội là bắt buộc' },
      len: { args: [2, 200], msg: 'Tên đội phải từ 2 đến 200 ký tự' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slogan: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
    validate: {
      min: { args: [2], msg: 'Đội cần ít nhất 2 người' },
      max: { args: [100], msg: 'Tối đa 100 thành viên' }
    }
  },
  currentMembers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  tableName: 'teams',
  timestamps: true,
  indexes: [
    { fields: ['sportId'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['name'] }
  ]
});

module.exports = Team;
