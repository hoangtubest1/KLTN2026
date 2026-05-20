const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
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
  role: {
    type: DataTypes.ENUM('captain', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'team_members',
  timestamps: true,
  indexes: [
    { fields: ['teamId'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    {
      unique: true,
      fields: ['teamId', 'userId'] // Mỗi user chỉ tham gia 1 lần/đội
    }
  ]
});

module.exports = TeamMember;
