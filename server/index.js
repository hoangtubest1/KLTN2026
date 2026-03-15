// Sports Booking Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
