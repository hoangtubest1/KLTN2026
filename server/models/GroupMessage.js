const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupMessage = sequelize.define('GroupMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'casual_groups',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null cho system messages
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tin nhắn không được trống' }
    }
  },
  type: {
    type: DataTypes.ENUM('text', 'system'),
    defaultValue: 'text',
    allowNull: false
  }
}, {
  tableName: 'group_messages',
  timestamps: true,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = GroupMessage;
