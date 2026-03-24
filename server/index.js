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

// DEBUG - check env vars and test login (DELETE AFTER USE)
app.get('/api/debug', async (req, res) => {
  const { User } = require('./models');
  const bcrypt = require('bcryptjs');
  try {
    const userCount = await User.count();
    const user = await User.findOne({ where: { email: 'admin@sports.com' } });
    let pwMatch = null;
    if (user) {
      pwMatch = await bcrypt.compare('admin123', user.password);
    }
    res.json({
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      USER_COUNT: userCount,
      USER_FOUND: !!user,
      PW_HASH_PREFIX: user?.password?.substring(0, 10),
      PW_MATCH: pwMatch,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 300) });
  }
});


// Database connection
const { sequelize, syncDatabase } = require('./models');

// Test MySQL connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connection established successfully');

    // Chỉ dùng alter: true khi DB_ALTER=true (chạy 1 lần để thêm columns mới, sau đó tắt)
    // KHÔNG dùng alter: true liên tục vì có thể gây mất data với MySQL ENUM columns
    const syncOptions = process.env.DB_ALTER === 'true' ? { alter: true } : {};
    if (syncOptions.alter) {
      console.log('⚠️ Running with ALTER mode - will modify tables to match models');
    }
    return syncDatabase(syncOptions);
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1);
  });

// Basic route
app.get('/', (req, res) => {
  // Check both possible client build paths
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const clientBuildPath = path.join(__dirname, '../client/build', 'index.html');
  if (require('fs').existsSync(publicPath)) {
    return res.sendFile(publicPath);
  }
  if (require('fs').existsSync(clientBuildPath)) {
    return res.sendFile(clientBuildPath);
  }
  res.json({ message: 'Sports Booking API is running' });
});

// Serve React client build (production)
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
const clientBuildDir = path.join(__dirname, '../client/build');
const servableDir = fs.existsSync(publicDir) ? publicDir : (fs.existsSync(clientBuildDir) ? clientBuildDir : null);

if (servableDir) {
  app.use(express.static(servableDir));
  
  // Catch-all: serve React index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(servableDir, 'index.html'));
  });
  console.log('📦 Serving React client from:', servableDir);
}

// Temporary seed endpoint (DELETE AFTER USE)
app.get('/api/seed', async (req, res) => {
  try {
    const { Sport, Facility, User } = require('./models');
    
    // Check if already seeded
    const sportCount = await Sport.count();
    if (sportCount > 0) {
      return res.json({ message: 'Database already seeded!', sportCount });
    }

    const sportsData = [
      { name: 'football', nameVi: 'Bóng Đá', description: 'Sân bóng đá chất lượng cao', pricePerHour: 200000 },
      { name: 'pickleball', nameVi: 'Pickleball', description: 'Sân Pickleball trong nhà, có điều hòa', pricePerHour: 100000 },
      { name: 'badminton', nameVi: 'Cầu Lông', description: 'Sân cầu lông trong nhà, có điều hòa', pricePerHour: 100000 },
      { name: 'tennis', nameVi: 'Tennis', description: 'Sân tennis ngoài trời, mặt sân đẹp', pricePerHour: 300000 },
      { name: 'basketball', nameVi: 'Bóng Rổ', description: 'Sân bóng rổ trong nhà, sàn gỗ', pricePerHour: 250000 },
      { name: 'volleyball', nameVi: 'Bóng Chuyền', description: 'Sân bóng chuyền trong nhà, sàn chống trượt', pricePerHour: 150000 },
    ];

    const sports = await Sport.bulkCreate(sportsData);

    const facilitiesData = {
      'football': [
        { name: 'Sân Thống Nhất', address: '123 Đường Nguyễn Huệ, Quận 1', phone: '0901234567', pricePerHour: 200000, description: 'Sân 11 người, cỏ nhân tạo cao cấp', courtCount: 3, latitude: 10.7769, longitude: 106.7009 },
        { name: 'Sân Phú Thọ', address: '456 Đường Lý Thường Kiệt, Quận 2', phone: '0901234568', pricePerHour: 200000, description: 'Sân 11 người, có mái che', courtCount: 2, latitude: 10.7867, longitude: 106.7485 },
        { name: 'Sân Tân Bình', address: '789 Đường Cộng Hòa, Quận Tân Bình', phone: '0901234569', pricePerHour: 180000, description: 'Sân 7 người', courtCount: 2, latitude: 10.8012, longitude: 106.6525 },
        { name: 'Sân Mini Gò Vấp', address: '321 Đường Quang Trung, Quận Gò Vấp', phone: '0901234570', pricePerHour: 150000, description: 'Sân 5 người mini', courtCount: 3, latitude: 10.8386, longitude: 106.6651 },
      ],
      'pickleball': [
        { name: 'Pickleball Arena', address: '111 Đường Nguyễn Văn Cừ, Quận 5', phone: '0902345671', pricePerHour: 100000, description: 'Sân trong nhà, điều hòa', courtCount: 4, latitude: 10.7590, longitude: 106.6832 },
        { name: 'Pickleball VIP Center', address: '222 Đường Hậu Giang, Quận 6', phone: '0902345672', pricePerHour: 100000, description: 'Sân VIP', courtCount: 2, latitude: 10.7468, longitude: 106.6352 },
        { name: 'Pickleball Park', address: '333 Đường Nguyễn Thị Thập, Quận 7', phone: '0902345673', pricePerHour: 90000, description: 'Sân tiêu chuẩn', courtCount: 3, latitude: 10.7375, longitude: 106.7218 },
      ],
      'badminton': [
        { name: 'Nhà Thi Đấu Rạch Miễu', address: '444 Đường Rạch Miễu, Quận Phú Nhuận', phone: '0903456781', pricePerHour: 100000, description: 'Sân trong nhà, điều hòa', courtCount: 4, latitude: 10.7994, longitude: 106.6850 },
        { name: 'CLB Cầu Lông Tân Phú', address: '555 Đường Lũy Bán Bích, Quận Tân Phú', phone: '0903456782', pricePerHour: 100000, description: 'Sân VIP', courtCount: 3, latitude: 10.7921, longitude: 106.6278 },
        { name: 'Sân Cầu Lông Thủ Đức', address: '666 Đường Võ Văn Ngân, TP Thủ Đức', phone: '0903456783', pricePerHour: 90000, description: 'Sân tiêu chuẩn', courtCount: 2, latitude: 10.8510, longitude: 106.7719 },
      ],
      'tennis': [
        { name: 'Sân Tennis Lan Anh', address: '777 Đường Hoàng Văn Thụ, Quận Tân Bình', phone: '0904567891', pricePerHour: 300000, description: 'Sân ngoài trời, mặt sân cứng', courtCount: 2, latitude: 10.7988, longitude: 106.6614 },
        { name: 'Tennis Club Phú Mỹ Hưng', address: '888 Đường Nguyễn Đức Cảnh, Quận 7', phone: '0904567892', pricePerHour: 350000, description: 'Sân VIP, có mái che', courtCount: 3, latitude: 10.7293, longitude: 106.7177 },
      ],
      'basketball': [
        { name: 'Sân Bóng Rổ CIS', address: '999 Đường Điện Biên Phủ, Bình Thạnh', phone: '0905678901', pricePerHour: 250000, description: 'Sân trong nhà, sàn gỗ', courtCount: 2, latitude: 10.8015, longitude: 106.7107 },
        { name: 'Sân Bóng Rổ Hoa Lư', address: '1010 Đường Đinh Tiên Hoàng, Quận 1', phone: '0905678902', pricePerHour: 250000, description: 'Sân tiêu chuẩn NBA', courtCount: 2, latitude: 10.7868, longitude: 106.6942 },
      ],
      'volleyball': [
        { name: 'Sân Bóng Chuyền Quân Khu 7', address: '1111 Đường Hoàng Hoa Thám, Tân Bình', phone: '0906789012', pricePerHour: 150000, description: 'Sân trong nhà', courtCount: 2, latitude: 10.8023, longitude: 106.6482 },
        { name: 'Sân Bóng Chuyền Phan Đình Phùng', address: '1212 Đường Phan Đình Phùng, Gò Vấp', phone: '0906789013', pricePerHour: 150000, description: 'Sân tiêu chuẩn', courtCount: 2, latitude: 10.8291, longitude: 106.6656 },
      ],
    };

    let totalFacilities = 0;
    for (const sport of sports) {
      const sf = facilitiesData[sport.name];
      if (sf) {
        await Facility.bulkCreate(sf.map(f => ({ ...f, sportId: sport.id })));
        totalFacilities += sf.length;
      }
    }

    // Create admin + user
    await User.create({ name: 'Admin', email: 'admin@sports.com', phone: '0900000000', password: 'admin123', role: 'admin' });
    await User.create({ name: 'Nguyễn Văn A', email: 'user@sports.com', phone: '0911111111', password: 'user123', role: 'user' });

    res.json({ 
      message: '🎉 Seed completed!', 
      sports: sports.length, 
      facilities: totalFacilities, 
      users: 2 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
