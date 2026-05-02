/**
 * Rate limiting middleware cho auth endpoints
 * Ngăn chặn brute-force attack, spam OTP, password guessing
 */
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * Giới hạn số lần đăng nhập sai:
 * - 5 lần trong 15 phút → khóa tạm 15 phút
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  message: {
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Phân biệt theo IP + email (nếu có) để tránh bypass khi đổi IP
    const ip = ipKeyGenerator(req);
    const email = req.body?.email || '';
    return `${ip}:${email.toLowerCase()}`;
  }
});

/**
 * Giới hạn số lần gửi OTP:
 * - 3 lần trong 10 phút → khóa tạm 10 phút
 */
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 3,
  message: {
    message: 'Bạn đã gửi quá nhiều yêu cầu OTP. Vui lòng thử lại sau 10 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    const email = req.body?.email || '';
    return `otp:${ip}:${email.toLowerCase()}`;
  }
});

/**
 * Giới hạn số lần xác minh OTP sai:
 * - 5 lần trong 10 phút → khóa tạm 10 phút
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 5,
  message: {
    message: 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    const email = req.body?.email || '';
    return `verify:${ip}:${email.toLowerCase()}`;
  }
});

/**
 * Giới hạn đăng ký tài khoản:
 * - 5 lần trong 1 giờ từ cùng IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5,
  message: {
    message: 'Bạn đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau 1 giờ.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Chỉ đếm request thất bại
});

module.exports = {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  registerLimiter
};
