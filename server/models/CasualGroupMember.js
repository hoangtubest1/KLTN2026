const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CasualGroupMember = sequelize.define('CasualGroupMember', {
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
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  isHost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'casual_group_members',
  timestamps: true,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['userId'] },
    {
      unique: true,
      fields: ['groupId', 'userId'] // Mỗi user chỉ join 1 lần/phòng
    }
  ]
});

module.exports = CasualGroupMember;
