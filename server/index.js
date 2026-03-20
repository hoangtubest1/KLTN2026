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
