import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Thông tin doanh nghiệp */}
          <div className="footer-section">
            <h3 className="footer-title">Về Chúng Tôi</h3>
            <div className="footer-logo">

              ⚽ Đặt Lịch Thể Thao
            </div>
            <p className="footer-description">
              Hệ thống đặt lịch thể thao hàng đầu, giúp bạn tìm và đặt sân bóng đá, cầu lông, tennis và nhiều môn thể thao khác một cách nhanh chóng và tiện lợi.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Zalo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Email">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Mục lục */}
          <div className="footer-section">
            <h3 className="footer-title">Mục Lục</h3>
            <ul className="footer-links">
              <li>
                <Link to="/">Trang Chủ</Link>
              </li>
              <li>
                <Link to="/booking">Đặt Lịch</Link>
              </li>
              <li>
                <Link to="/bookings">Lịch Đã Đặt</Link>
              </li>
              <li>
                <Link to="/login">Đăng Nhập</Link>
              </li>
              <li>
                <Link to="/register">Đăng Ký</Link>
              </li>
            </ul>
          </div>

          {/* Thông tin liên hệ */}
          <div className="footer-section">
            <h3 className="footer-title">Liên Hệ</h3>
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
                <a href="mailto:info@datsan247.com">info@datsan247.com</a>
              </li>
              <li>
                <span className="contact-icon">🕒</span>
                <span>Thứ 2 - Chủ Nhật: 6:00 - 22:00</span>
              </li>
            </ul>
          </div>

          {/* Dịch vụ */}
          <div className="footer-section">
            <h3 className="footer-title">Dịch Vụ</h3>
            <ul className="footer-links">
              <li>
                <a href="#">Đặt sân bóng đá</a>
              </li>
              <li>
                <a href="#">Đặt sân cầu lông</a>
              </li>
              <li>
                <a href="#">Đặt sân tennis</a>
              </li>
              <li>
                <a href="#">Đặt sân bóng rổ</a>
              </li>
              <li>
                <a href="#">Hướng dẫn đặt lịch</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              © {currentYear} Đặt Lịch Thể Thao. Tất cả quyền được bảo lưu.
            </p>
            <p className="footer-legal">
              <a href="#">Chính sách bảo mật</a> | 
              <a href="#"> Điều khoản sử dụng</a> | 
              <a href="#"> Chính sách hoàn tiền</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

