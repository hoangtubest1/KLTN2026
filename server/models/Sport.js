const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sport = sequelize.define('Sport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Sport name already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Sport name is required'
      }
    }
  },
  nameVi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Vietnamese name is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(10, 2), // 10 digits, 2 decimal places
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Price must be positive'
      }
    }
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'sports',
  timestamps: true // createdAt, updatedAt
});

module.exports = Sport;
