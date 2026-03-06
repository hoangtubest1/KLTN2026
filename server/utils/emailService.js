const nodemailer = require('nodemailer');

// Create transporter with Gmail configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
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
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: booking.customerEmail,
      subject: `✅ Xác nhận đặt sân - ${booking.sport?.nameVi || booking.sport?.name || ''} - ${new Date(booking.date).toLocaleDateString('vi-VN')}`,
      html: generateBookingEmailHTML(booking),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send confirmed booking email
const sendConfirmedBookingEmail = async (booking) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: booking.customerEmail,
      subject: `🎉 Đặt sân đã được xác nhận - ${booking.sport?.nameVi || booking.sport?.name || ''} - ${new Date(booking.date).toLocaleDateString('vi-VN')}`,
      html: generateConfirmedBookingEmailHTML(booking),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmed booking email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
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
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🔐 Mã đặt lại mật khẩu - Sports Booking`,
      html: generatePasswordResetEmailHTML(otp),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendConfirmedBookingEmail,
  sendPasswordResetEmail,
};
