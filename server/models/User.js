const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Name is required'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email already exists'
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    },
    set(value) {
      // Tự động lowercase và trim
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  googleId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'owner', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  /** Giấy phép kinh doanh (ảnh upload) */
  businessLicense: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  /** CCCD mặt trước */
  idCardFront: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  /** CCCD mặt sau */
  idCardBack: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  /** Trạng thái duyệt tài khoản chủ sân */
  ownerStatus: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none',
    allowNull: false
  },
  /** Ghi chú từ admin khi duyệt */
  ownerNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  resetPasswordOTP: {
    type: DataTypes.STRING(6),
    allowNull: true,
    defaultValue: null
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true, // createdAt, updatedAt

  // Hooks - Lifecycle events
  hooks: {
    // Hash password trước khi tạo user mới
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },

    // Hash password trước khi update (nếu password thay đổi)
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method - So sánh password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Class method - Tìm user theo email
User.findByEmail = async function (email) {
  return await this.findOne({
    where: { email: email.toLowerCase().trim() }
  });
};

module.exports = User;
