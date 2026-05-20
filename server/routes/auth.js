const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { loginLimiter, otpRequestLimiter, otpVerifyLimiter, registerLimiter } = require('../middleware/rateLimit');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, [
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
        role: user.role,
        ownerStatus: user.ownerStatus
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
router.post('/login', loginLimiter, [
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
        role: user.role,
        ownerStatus: user.ownerStatus
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
router.post('/forgot-password', otpRequestLimiter, [
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
    try {
      await user.update({
        resetPasswordOTP: otp,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
      });
      console.log(`🔐 OTP saved for ${email}: ${otp}`);
    } catch (dbError) {
      console.error('❌ Failed to save OTP to database:', dbError.message);
      console.error('   Possible missing columns: resetPasswordOTP, resetPasswordExpires');
      return res.status(500).json({ message: 'Lỗi server. Vui lòng restart server.' });
    }

    // Respond immediately so the client can show OTP input page
    res.json({ message: 'Mã OTP đã được gửi đến email của bạn' });

    // Send email in background (don't block the response)
    sendPasswordResetEmail(email, otp)
      .then(result => {
        if (result.success) {
          console.log(`✅ Password reset email sent to ${email}`);
        } else {
          console.error(`❌ Password reset email failed for ${email}:`, result.error);
        }
      })
      .catch(err => {
        console.error(`❌ Password reset email error for ${email}:`, err.message);
      });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP code
// @access  Public
router.post('/verify-otp', otpVerifyLimiter, [
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

// @route   POST /api/auth/google
// @desc    Login/Register with Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Thiếu thông tin xác thực Google' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Không thể lấy email từ tài khoản Google' });
    }

    // Find user by googleId or email
    let user = await User.findOne({ where: { googleId } });

    if (!user) {
      // Check if user with same email exists (registered with email/password before)
      user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

      if (user) {
        // Link Google account to existing user
        await user.update({ googleId, avatar: user.avatar || picture });
      } else {
        // Create new user
        user = await User.create({
          name,
          email: email.toLowerCase().trim(),
          phone: '',
          googleId,
          avatar: picture,
          password: null,
        });
      }
    } else {
      // Update avatar if changed
      if (picture && user.avatar !== picture) {
        await user.update({ avatar: picture });
      }
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
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Token Google không hợp lệ hoặc đã hết hạn' });
    }
    res.status(500).json({ message: 'Lỗi server khi đăng nhập bằng Google' });
  }
});

// @route   POST /api/auth/register-owner
// @desc    Register as facility owner (requires admin approval)
// @access  Public
router.post('/register-owner', registerLimiter, [
  body('name').notEmpty().withMessage('Tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('phone').notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('businessLicense').notEmpty().withMessage('Giấy phép kinh doanh là bắt buộc'),
  body('idCardFront').notEmpty().withMessage('Ảnh CCCD mặt trước là bắt buộc'),
  body('idCardBack').notEmpty().withMessage('Ảnh CCCD mặt sau là bắt buộc'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, businessLicense, idCardFront, idCardBack } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Create new owner user (pending approval)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'owner',
      ownerStatus: 'pending',
      businessLicense: businessLicense || null,
      idCardFront: idCardFront || null,
      idCardBack: idCardBack || null
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ownerStatus: user.ownerStatus
      },
      message: 'Đăng ký chủ sân thành công! Tài khoản đang chờ admin duyệt.'
    });
  } catch (error) {
    console.error('Register owner error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký chủ sân' });
  }
});

// @route   POST /api/auth/upgrade-to-owner
// @desc    Upgrade existing logged-in user to owner role
// @access  Private (requires auth)
const { auth } = require('../middleware/auth');
router.post('/upgrade-to-owner', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    if (user.role === 'owner') {
      return res.status(400).json({ message: 'Bạn đã đăng ký chủ sân rồi. Trạng thái: ' + user.ownerStatus });
    }

    const { businessLicense, idCardFront, idCardBack } = req.body;

    if (!businessLicense) {
      return res.status(400).json({ message: 'Giấy phép kinh doanh là bắt buộc' });
    }
    if (!idCardFront) {
      return res.status(400).json({ message: 'Ảnh CCCD mặt trước là bắt buộc' });
    }
    if (!idCardBack) {
      return res.status(400).json({ message: 'Ảnh CCCD mặt sau là bắt buộc' });
    }

    await user.update({
      role: 'owner',
      ownerStatus: 'pending',
      businessLicense: businessLicense || null,
      idCardFront: idCardFront || null,
      idCardBack: idCardBack || null
    });

    res.json({
      message: 'Đăng ký chủ sân thành công! Tài khoản đang chờ admin duyệt.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ownerStatus: user.ownerStatus
      }
    });
  } catch (error) {
    console.error('Upgrade to owner error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;


