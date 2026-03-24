const nodemailer = require('nodemailer');

// Validate email configuration at startup
const validateEmailConfig = () => {
  // If Resend API key is set, we don't need SMTP config
  if (process.env.RESEND_API_KEY) {
    return true;
  }
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️ Email config missing: ${missing.join(', ')}. Emails will not be sent.`);
    return false;
  }
  return true;
};

// Create transporter with Gmail configuration (for localhost/SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email via Resend HTTP API (for production/Railway)
const sendViaResend = async (to, subject, html) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Sports Booking <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  }
  return data;
};

// Unified email sender - uses Resend API if available, otherwise SMTP
const sendEmail = async (to, subject, html) => {
  if (process.env.RESEND_API_KEY) {
    console.log(`📧 Sending email via Resend API to: ${to}`);
    const result = await sendViaResend(to, subject, html);
    console.log(`✅ Email sent via Resend:`, result.id);
    return { success: true, messageId: result.id };
  } else {
    const transporter = createTransporter();
    console.log(`📧 Sending email via SMTP to: ${to} via ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    });
    console.log('✅ Email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  }
};

// Generate HTML email template for booking confirmation (pending status)
const generateBookingEmailHTML = (booking) => {
  const { customerName, sport, facilityName, date, startTime, endTime, duration, totalPrice } = booking;

  const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          text-align: center;
          margin: -30px -30px 30px -30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
          background-color: #ffc107;
          color: #000;
        }
        .booking-details {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #667eea;
        }
        .detail-value {
          color: #333;
        }
        .price-total {
          background-color: #667eea;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">⚽</div>
          <h1>Xác Nhận Đặt Sân</h1>
          <span class="status-badge">Đang chờ xác nhận</span>
        </div>
        
        <p>Xin chào <strong>${customerName}</strong>,</p>
        
        <p>Cảm ơn bạn đã đặt sân tại hệ thống của chúng tôi. Dưới đây là thông tin chi tiết về đặt sân của bạn:</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">🏃 Môn thể thao:</span>
            <span class="detail-value">${sport?.nameVi || sport?.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🏟️ Sân:</span>
            <span class="detail-value">${facilityName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Ngày:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🕐 Giờ bắt đầu:</span>
            <span class="detail-value">${startTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🕐 Giờ kết thúc:</span>
            <span class="detail-value">${endTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏱️ Thời lượng:</span>
            <span class="detail-value">${duration} giờ</span>
          </div>
        </div>
        
        <div class="price-total">
          💰 Tổng tiền: ${totalPrice.toLocaleString('vi-VN')} VNĐ
        </div>
        
        <p><strong>Trạng thái:</strong> Đơn đặt sân của bạn đang chờ xác nhận từ quản trị viên. Chúng tôi sẽ thông báo cho bạn ngay khi đơn được xác nhận.</p>
        
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        
        <div class="footer">
          <p><strong>Sports Booking System</strong></p>
          <p>Email: ${process.env.EMAIL_USER}</p>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! 🙏</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML email template for confirmed bookings
const generateConfirmedBookingEmailHTML = (booking) => {
  const { customerName, sport, facilityName, date, startTime, endTime, duration, totalPrice } = booking;

  const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          text-align: center;
          margin: -30px -30px 30px -30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
          background-color: #d1fae5;
          color: #065f46;
        }
        .success-message {
          background-color: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #065f46;
          font-weight: bold;
        }
        .booking-details {
          background-color: #f8f9fa;
          border-left: 4px solid #10b981;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #10b981;
        }
        .detail-value {
          color: #333;
        }
        .price-total {
          background-color: #10b981;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        .reminder-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">✅</div>
          <h1>Đặt Sân Đã Được Xác Nhận!</h1>
          <span class="status-badge">Đã xác nhận</span>
        </div>
        
        <div class="success-message">
          🎉 Chúc mừng! Đơn đặt sân của bạn đã được xác nhận thành công!
        </div>
        
        <p>Xin chào <strong>${customerName}</strong>,</p>
        
        <p>Chúng tôi vui mừng thông báo rằng đơn đặt sân của bạn đã được quản trị viên xác nhận. Dưới đây là thông tin chi tiết:</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">🏃 Môn thể thao:</span>
            <span class="detail-value">${sport?.nameVi || sport?.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🏟️ Sân:</span>
            <span class="detail-value">${facilityName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Ngày:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🕐 Giờ bắt đầu:</span>
            <span class="detail-value">${startTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🕐 Giờ kết thúc:</span>
            <span class="detail-value">${endTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏱️ Thời lượng:</span>
            <span class="detail-value">${duration} giờ</span>
          </div>
        </div>
        
        <div class="price-total">
          💰 Tổng tiền: ${totalPrice.toLocaleString('vi-VN')} VNĐ
        </div>
        
        <div class="reminder-box">
          <strong>⏰ Lưu ý quan trọng:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Vui lòng có mặt đúng giờ để tận dụng tối đa thời gian đặt sân</li>
            <li>Mang theo giày thể thao và trang phục phù hợp</li>
            <li>Thanh toán trực tiếp tại quầy khi đến sân</li>
          </ul>
        </div>
        
        <p>Nếu bạn cần hủy hoặc thay đổi lịch đặt sân, vui lòng liên hệ với chúng tôi sớm nhất có thể.</p>
        
        <p>Chúc bạn có trải nghiệm thể thao tuyệt vời! 🏆</p>
        
        <div class="footer">
          <p><strong>Sports Booking System</strong></p>
          <p>Email: ${process.env.EMAIL_USER}</p>
          <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi! 🙏</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (booking) => {
  try {
    if (!validateEmailConfig()) {
      return { success: false, error: 'Email configuration is missing' };
    }

    const subject = `✅ Xác nhận đặt sân - ${booking.sport?.nameVi || booking.sport?.name || ''} - ${new Date(booking.date).toLocaleDateString('vi-VN')}`;
    const html = generateBookingEmailHTML(booking);
    return await sendEmail(booking.customerEmail, subject, html);
  } catch (error) {
    console.error('❌ Error sending booking email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send confirmed booking email
const sendConfirmedBookingEmail = async (booking) => {
  try {
    if (!validateEmailConfig()) {
      return { success: false, error: 'Email configuration is missing' };
    }

    const subject = `🎉 Đặt sân đã được xác nhận - ${booking.sport?.nameVi || booking.sport?.name || ''} - ${new Date(booking.date).toLocaleDateString('vi-VN')}`;
    const html = generateConfirmedBookingEmailHTML(booking);
    return await sendEmail(booking.customerEmail, subject, html);
  } catch (error) {
    console.error('❌ Error sending confirmed booking email:', error.message);
    return { success: false, error: error.message };
  }
};

// Generate HTML email template for password reset OTP
const generatePasswordResetEmailHTML = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          text-align: center;
          margin: -30px -30px 30px -30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .otp-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 25px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .otp-note {
          font-size: 13px;
          opacity: 0.9;
        }
        .warning-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🔐</div>
          <h1>Đặt Lại Mật Khẩu</h1>
        </div>
        
        <p>Xin chào,</p>
        
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>
        
        <div class="otp-box">
          <p class="otp-note">Mã xác nhận của bạn</p>
          <div class="otp-code">${otp}</div>
          <p class="otp-note">Mã có hiệu lực trong 10 phút</p>
        </div>
        
        <div class="warning-box">
          <strong>⚠️ Lưu ý:</strong>
          <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Không chia sẻ mã OTP này cho bất kỳ ai</li>
            <li>Mã sẽ hết hạn sau 10 phút</li>
            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
          </ul>
        </div>
        
        <div class="footer">
          <p><strong>Sports Booking System</strong></p>
          <p>Email: ${process.env.EMAIL_USER}</p>
          <p>Đây là email tự động, vui lòng không trả lời. 🙏</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send password reset OTP email
const sendPasswordResetEmail = async (email, otp) => {
  try {
    if (!validateEmailConfig()) {
      return { success: false, error: 'Email configuration is missing' };
    }

    const subject = `🔐 Mã đặt lại mật khẩu - Sports Booking`;
    const html = generatePasswordResetEmailHTML(otp);
    return await sendEmail(email, subject, html);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

// Generate HTML email template for completed booking
const generateCompletedBookingEmailHTML = (booking) => {
  const { customerName, sport, facilityName, date, startTime, endTime, duration, totalPrice } = booking;

  const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #10b981 100%);
          color: white;
          padding: 20px;
          border-radius: 10px 10px 0 0;
          text-align: center;
          margin: -30px -30px 30px -30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .status-badge {
          display: inline-block;
          background-color: rgba(255,255,255,0.2);
          padding: 5px 15px;
          border-radius: 20px;
          margin-top: 10px;
          font-size: 14px;
        }
        .success-message {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 16px;
        }
        .booking-details {
          background-color: #f8f9fa;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #f59e0b;
        }
        .price-total {
          background-color: #f59e0b;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        .thank-box {
          background-color: #ecfdf5;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🏆</div>
          <h1>Đặt Sân Đã Hoàn Thành!</h1>
          <span class="status-badge">Hoàn thành</span>
        </div>
        
        <div class="success-message">
          🎉 Buổi đặt sân của bạn đã hoàn thành! Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
        </div>
        
        <p>Xin chào <strong>${customerName}</strong>,</p>
        
        <p>Chúng tôi xin thông báo rằng buổi đặt sân của bạn đã được hoàn thành. Dưới đây là thông tin chi tiết:</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">🏃 Môn thể thao:</span>
            <span>${sport?.nameVi || sport?.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🏟️ Sân:</span>
            <span>${facilityName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Ngày:</span>
            <span>${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🕐 Giờ:</span>
            <span>${startTime} - ${endTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏱️ Thời lượng:</span>
            <span>${duration} giờ</span>
          </div>
        </div>
        
        <div class="price-total">
          💰 Tổng tiền: ${totalPrice?.toLocaleString('vi-VN') || '0'} VNĐ
        </div>
        
        <div class="thank-box">
          <strong>🙏 Cảm ơn bạn!</strong>
          <p style="margin: 10px 0 0 0;">Chúng tôi hy vọng bạn đã có trải nghiệm thể thao tuyệt vời. Hẹn gặp lại bạn lần sau!</p>
          <p style="margin: 5px 0 0 0;">Nếu bạn có góp ý, đừng ngần ngại liên hệ với chúng tôi nhé! ⭐</p>
        </div>
        
        <div class="footer">
          <p><strong>Sports Booking System</strong></p>
          <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi! 🏆</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send completed booking email
const sendCompletedBookingEmail = async (booking) => {
  try {
    if (!validateEmailConfig()) {
      return { success: false, error: 'Email configuration is missing' };
    }

    const subject = `🏆 Đặt sân hoàn thành - ${booking.sport?.nameVi || booking.sport?.name || ''} - ${new Date(booking.date).toLocaleDateString('vi-VN')}`;
    const html = generateCompletedBookingEmailHTML(booking);
    return await sendEmail(booking.customerEmail, subject, html);
  } catch (error) {
    console.error('❌ Error sending completed booking email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendConfirmedBookingEmail,
  sendCompletedBookingEmail,
  sendPasswordResetEmail,
};
