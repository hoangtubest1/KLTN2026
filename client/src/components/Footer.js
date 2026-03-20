import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import soccerPlayer from '../assets/soccer-player.png';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [ctaForm, setCtaForm] = useState({ name: '', phone: '', email: '' });
  const [ctaMsg, setCtaMsg] = useState('');

  const handleCtaSubmit = (e) => {
    e.preventDefault();
    if (!ctaForm.name || !ctaForm.phone) {
      setCtaMsg('Vui lòng nhập đầy đủ họ tên và số điện thoại');
      return;
    }
    setCtaMsg('Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
    setCtaForm({ name: '', phone: '', email: '' });
    setTimeout(() => setCtaMsg(''), 4000);
  };

  return (
    <>
      {/* CTA Banner - giống datsan247 */}
      <div className="cta-banner">
        <div className="cta-container">
          {/* Soccer Player Image */}
          <div className="cta-illustration">
            <img
              src={soccerPlayer}
              alt="Cầu thủ bóng đá"
              className="player-img"
            />
          </div>

          {/* CTA Text */}
          <div className="cta-text">
            <p className="cta-title">
              Bạn muốn đăng ký sử dụng<br/>
              phần mềm quản lý sân<br/>
              <strong>TÌM SÂN</strong> MIỄN PHÍ?
            </p>
          </div>

          {/* CTA Form */}
          <form onSubmit={handleCtaSubmit} className="cta-form">
            <input
              type="text"
              value={ctaForm.name}
              onChange={(e) => setCtaForm({ ...ctaForm, name: e.target.value })}
              placeholder="Họ & tên *"
              className="cta-input"
            />
            <input
              type="tel"
              value={ctaForm.phone}
              onChange={(e) => setCtaForm({ ...ctaForm, phone: e.target.value })}
              placeholder="Số điện thoại *"
              className="cta-input"
            />
            <input
              type="email"
              value={ctaForm.email}
              onChange={(e) => setCtaForm({ ...ctaForm, email: e.target.value })}
              placeholder="Email"
              className="cta-input"
            />
            <button type="submit" className="cta-button">
              GỬI
            </button>
          </form>
        </div>
        {ctaMsg && (
          <p className="cta-message" style={{ color: ctaMsg.includes('thành công') ? '#68d391' : '#fc8181' }}>
            {ctaMsg}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer id="footer-contact" className="footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* GIỚI THIỆU */}
            <div className="footer-section">
              <h3 className="footer-title">GIỚI THIỆU</h3>
              <ul className="footer-links">
                <li><Link to="/">Trang Chủ</Link></li>
                <li><Link to="/fields">Danh Sách Sân</Link></li>
                <li><Link to="/owner">Dành Cho Chủ Sân</Link></li>
                <li><a href="#">Về Chúng Tôi</a></li>
                <li><a href="#">Chính Sách Bảo Mật</a></li>
                <li><a href="#">Điều Khoản Sử Dụng</a></li>
              </ul>
            </div>

            {/* THÔNG TIN */}
            <div className="footer-section">
              <h3 className="footer-title">THÔNG TIN</h3>
              <ul className="footer-links">
                <li><a href="#">Đặt sân bóng đá</a></li>
                <li><a href="#">Đặt sân cầu lông</a></li>
                <li><a href="#">Đặt sân tennis</a></li>
                <li><a href="#">Đặt sân pickleball</a></li>
                <li><a href="#">Hướng dẫn đặt lịch</a></li>
                <li><a href="#">Câu hỏi thường gặp</a></li>
              </ul>
            </div>

            {/* LIÊN HỆ */}
            <div className="footer-section">
              <h3 className="footer-title">LIÊN HỆ</h3>
              <ul className="footer-contact">
                <li>
                  <span className="contact-icon">📍</span>
                  <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
                </li>
                <li>
                  <span className="contact-icon">📞</span>
                  <a href="tel:+84123456789">0123 456 789</a>
                </li>
                <li>
                  <span className="contact-icon">📱</span>
                  <a href="tel:+84987654321">0987 654 321</a>
                </li>
                <li>
                  <span className="contact-icon">✉️</span>
                  <a href="mailto:info@timsan.com">info@timsan.com</a>
                </li>
                <li>
                  <span className="contact-icon">🕐</span>
                  <span>Thứ 2 - Chủ Nhật: 6:00 - 22:00</span>
                </li>
              </ul>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Zalo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Email">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bản quyền */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>
                © {currentYear} TÌM SÂN .com - Hệ thống tìm kiếm và đặt sân thể thao. Tất cả quyền được bảo lưu.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
