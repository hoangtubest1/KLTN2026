import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Phone update modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    if (user && !showPhoneModal) navigate('/', { replace: true });
  }, [user, navigate, showPhoneModal]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      if (!result.user?.phone) {
        setShowPhoneModal(true);
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      return;
    }
    const phoneRegex = /^(0[0-9]{9,10})$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setPhoneError('Số điện thoại không hợp lệ');
      return;
    }
    setPhoneSaving(true);
    setPhoneError('');
    try {
      const res = await api.put('/auth/profile', { phone: phoneNumber.trim() });
      updateUser(res.data.user);
      setShowPhoneModal(false);
      navigate('/');
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Lỗi cập nhật số điện thoại');
    }
    setPhoneSaving(false);
  };

  const handlePhoneSkip = () => {
    setShowPhoneModal(false);
    navigate('/');
  };

  return (
    <div className="auth-page">
      {/* Phone Update Modal */}
      {showPhoneModal && (
        <div className="phone-modal-overlay">
          <div className="phone-modal">
            <div className="phone-modal-icon">📱</div>
            <h3>Cập nhật số điện thoại</h3>
            <p>Vui lòng nhập số điện thoại để hoàn tất đăng ký và nhận thông báo đặt sân.</p>
            {phoneError && <div className="phone-modal-error">{phoneError}</div>}
            <div className="phone-modal-input-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input
                type="tel"
                placeholder="VD: 0901234567"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                autoFocus
              />
            </div>
            <button className="phone-modal-submit" onClick={handlePhoneSubmit} disabled={phoneSaving}>
              {phoneSaving ? 'Đang lưu...' : 'Cập nhật'}
            </button>
            <button className="phone-modal-skip" onClick={handlePhoneSkip}>
              Bỏ qua, cập nhật sau
            </button>
          </div>
        </div>
      )}

      {/* LEFT – Branding Panel */}
      <div className="auth-brand">
        <img src="/football_bg.jpg.jpg" alt="" className="auth-brand-bg" />

        {/* Logo */}
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">⚽</div>
          <span className="auth-brand-logo-text">Timsan247</span>
        </div>

        {/* Headline */}
        <h1>
          Đặt sân bóng<br />
          <span>nhanh chóng</span><br />
          &amp; tiện lợi
        </h1>

        <p className="auth-brand-subtitle">
          Tham gia cùng hơn 50,000+ người chơi bóng đá. Tìm sân, đặt lịch và thanh toán chỉ trong vài giây.
        </p>

        {/* Feature list */}
        <ul className="auth-brand-features">
          <li>
            <span className="auth-feature-check">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Đặt sân 24/7, mọi lúc mọi nơi
          </li>
          <li>
            <span className="auth-feature-check">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Thanh toán an toàn, bảo mật
          </li>
          <li>
            <span className="auth-feature-check">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Hỗ trợ khách hàng tận tình
          </li>
        </ul>
      </div>

      {/* RIGHT – Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn trở lại! Vui lòng đăng nhập</p>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-form-group">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Vui lòng nhập email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.7 11.7 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829M17.657 17.657L21 21m-3.343-3.343l-2.829-2.829M9.88 9.88a3 3 0 104.24 4.24M9.88 9.88l4.24 4.24" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="auth-form-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="auth-forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg className="auth-spinner" width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>Hoặc</span>
          </div>

          {/* Google */}
          <div className="auth-google-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Đăng nhập bằng Google thất bại')}
              text="signin_with"
              shape="rectangular"
              size="large"
              width="100%"
              locale="vi_VN"
            />
          </div>

          {/* Footer */}
          <p className="auth-footer-link">
            Chưa có tài khoản?{' '}
            <Link to="/register">Đăng ký ngay</Link>
          </p>

          <p className="auth-terms">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <Link to="/terms-of-service">Điều khoản dịch vụ</Link> và{' '}
            <Link to="/terms-of-service">Chính sách bảo mật</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
