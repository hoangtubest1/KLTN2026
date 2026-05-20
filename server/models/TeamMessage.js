const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMessage = sequelize.define('TeamMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
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
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nội dung tin nhắn không thể bỏ trống' }
    }
  }
}, {
  tableName: 'team_messages',
  timestamps: true,
  indexes: [
    { fields: ['teamId'] },
    { fields: ['userId'] }
  ]
});

module.exports = TeamMessage;
