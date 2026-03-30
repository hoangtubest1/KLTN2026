const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sportId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sports',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' // Không cho xóa sport nếu có booking
  },
  facilityName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Facility name is required'
      }
    }
  },
  facilityAddress: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  facilityPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Customer name is required'
      }
    }
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Customer phone is required'
      }
    }
  },
  customerEmail: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Must be a valid email'
      },
      notEmpty: {
        msg: 'Customer email is required'
      }
    }
  },
  date: {
    type: DataTypes.DATEONLY, // Chỉ lưu ngày (YYYY-MM-DD)
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Must be a valid date'
      }
    }
  },
  startTime: {
    type: DataTypes.TIME, // Lưu giờ (HH:MM:SS)
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.DECIMAL(5, 2), // Số giờ (ví dụ: 1.5, 2.0)
    allowNull: false,
    validate: {
      min: {
        args: [0.5],
        msg: 'Duration must be at least 0.5 hours'
      }
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price must be positive'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'pending_payment'),
    defaultValue: 'pending',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  couponCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.ENUM('at_venue', 'vnpay', 'momo'),
    defaultValue: 'at_venue',
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'failed', 'refunded'),
    defaultValue: 'unpaid',
    allowNull: false
  },
  vnpayTxnRef: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true, // createdAt, updatedAt

  // Indexes để tăng performance
  indexes: [
    {
      fields: ['date'] // Index cho date queries
    },
    {
      fields: ['sportId'] // Index cho sport queries
    },
    {
      fields: ['status'] // Index cho status filtering
    },
    {
      fields: ['customerEmail'] // Index cho customer lookup
    }
  ]
});

module.exports = Booking;
