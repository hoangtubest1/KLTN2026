const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('phone').notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclude password field
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', require('../middleware/auth').auth, [
  body('name').optional().notEmpty().withMessage('Tên không được để trống'),
  body('phone').optional().notEmpty().withMessage('Số điện thoại không được để trống'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const { name, phone, currentPassword, newPassword } = req.body;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (newPassword) updateData.password = newPassword;

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ message: 'Cập nhật thông tin thành công!', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to user email for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP and expiry (10 minutes)
    await user.update({
      resetPasswordOTP: otp,
      resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send email
    const result = await sendPasswordResetEmail(email, otp);
    if (!result.success) {
      return res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại sau.' });
    }

    res.json({ message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP code
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 số'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    // Check OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    // Check expiry
    if (new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    res.json({ message: 'Mã OTP hợp lệ' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 số'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    // Verify OTP again
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Update password and clear OTP
    await user.update({
      password: newPassword,
      resetPasswordOTP: null,
      resetPasswordExpires: null
    });

    res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;

