// Sports Booking Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Cho phép mọi IP LAN 192.168.x.x
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Cho phép mọi IP LAN 10.x.x.x
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sports', require('./routes/sports'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/payment', require('./routes/payment'));

// TEMP SEED ENDPOINT - DELETE AFTER USE
app.get('/api/seed-db', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { Sport, Facility, User, sequelize: seq } = require('./models');
    await seq.sync({ force: true });

    const sports = await Sport.bulkCreate([
      { name: 'football', nameVi: 'Bóng Đá', description: 'Sân bóng đá', pricePerHour: 200000 },
      { name: 'badminton', nameVi: 'Cầu Lông', description: 'Sân cầu lông', pricePerHour: 100000 },
      { name: 'pickleball', nameVi: 'Pickleball', description: 'Sân Pickleball', pricePerHour: 100000 },
      { name: 'tennis', nameVi: 'Tennis', description: 'Sân tennis', pricePerHour: 300000 },
      { name: 'basketball', nameVi: 'Bóng Rổ', description: 'Sân bóng rổ', pricePerHour: 250000 },
      { name: 'volleyball', nameVi: 'Bóng Chuyền', description: 'Sân bóng chuyền', pricePerHour: 150000 },
    ]);

    const fball = sports.find(s => s.name === 'football');
    const bad = sports.find(s => s.name === 'badminton');
    const pick = sports.find(s => s.name === 'pickleball');
    const ten = sports.find(s => s.name === 'tennis');
    const bball = sports.find(s => s.name === 'basketball');
    const vball = sports.find(s => s.name === 'volleyball');

    await Facility.bulkCreate([
      { name: 'Sân Thống Nhất', address: '123 Nguyễn Huệ, Q1, TP.HCM', phone: '0901234567', pricePerHour: 200000, description: 'Sân 11 người, cỏ nhân tạo', courtCount: 3, status: 'active', sportId: fball.id },
      { name: 'Sân Phú Thọ', address: '456 Lý Thường Kiệt, Q2, TP.HCM', phone: '0901234568', pricePerHour: 180000, description: 'Sân 7 người có mái che', courtCount: 2, status: 'active', sportId: fball.id },
      { name: 'Sân Mini Gò Vấp', address: '321 Quang Trung, Gò Vấp, TP.HCM', phone: '0901234570', pricePerHour: 150000, description: 'Sân 5 người mini', courtCount: 3, status: 'active', sportId: fball.id },
      { name: 'Nhà Thi Đấu Rạch Miễu', address: '444 Rạch Miễu, Phú Nhuận, TP.HCM', phone: '0903456781', pricePerHour: 100000, description: 'Sân trong nhà, điều hòa', courtCount: 4, status: 'active', sportId: bad.id },
      { name: 'CLB Cầu Lông Tân Phú', address: '555 Lũy Bán Bích, Tân Phú, TP.HCM', phone: '0903456782', pricePerHour: 100000, description: 'Sân VIP có điều hòa', courtCount: 3, status: 'active', sportId: bad.id },
      { name: 'Pickleball Arena', address: '111 Nguyễn Văn Cừ, Q5, TP.HCM', phone: '0902345671', pricePerHour: 100000, description: 'Sân trong nhà', courtCount: 4, status: 'active', sportId: pick.id },
      { name: 'Sân Tennis Lan Anh', address: '777 Hoàng Văn Thụ, Tân Bình, TP.HCM', phone: '0904567891', pricePerHour: 300000, description: 'Sân ngoài trời, mặt sân cứng', courtCount: 2, status: 'active', sportId: ten.id },
      { name: 'Tennis Club Phú Mỹ Hưng', address: '888 Nguyễn Đức Cảnh, Q7, TP.HCM', phone: '0904567892', pricePerHour: 350000, description: 'Sân VIP có mái che', courtCount: 3, status: 'active', sportId: ten.id },
      { name: 'Sân Bóng Rổ CIS', address: '999 Điện Biên Phủ, Bình Thạnh, TP.HCM', phone: '0905678901', pricePerHour: 250000, description: 'Sân trong nhà, sàn gỗ', courtCount: 2, status: 'active', sportId: bball.id },
      { name: 'Sân Bóng Chuyền Quân Khu 7', address: '1111 Hoàng Hoa Thám, Tân Bình, TP.HCM', phone: '0906789012', pricePerHour: 150000, description: 'Sân trong nhà chuẩn', courtCount: 2, status: 'active', sportId: vball.id },
    ]);

    await User.create({ name: 'Admin', email: 'admin@sports.com', phone: '0900000000', password: 'admin123', role: 'admin' });
    await User.create({ name: 'Nguyễn Văn A', email: 'user@sports.com', phone: '0911111111', password: 'user123', role: 'user' });

    res.json({ success: true, message: '✅ Seeded 10 facilities, 6 sports, 2 users!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Database connection
const { sequelize, syncDatabase } = require('./models');

// Test MySQL connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connection established successfully');

    // Sync database - dùng alter: true để thêm cột mới, sau đó có thể đổi lại thành syncDatabase()
    return syncDatabase({ alter: process.env.DB_ALTER === 'true' });
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Sports Booking API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
