// Sports Booking Server
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// ── Socket.IO Setup ──
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Cho phép tất cả origins giống CORS config bên dưới
      if (!origin) return callback(null, true);
      const allowedPatterns = [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3000',
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
        /^https:\/\/.*\.devtunnels\.ms$/,
      ];
      const isAllowed = allowedPatterns.some(p =>
        typeof p === 'string' ? p === origin : p.test(origin)
      );
      callback(null, isAllowed);
    },
    credentials: true
  }
});

// Export io globally so routes can emit events
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Client joins a facility+date room to receive slot updates
  socket.on('join-facility', ({ facilityId, date }) => {
    if (facilityId && date) {
      const room = `facility:${facilityId}:${date}`;
      socket.join(room);
    }
  });

  // Client leaves a facility+date room
  socket.on('leave-facility', ({ facilityId, date }) => {
    if (facilityId && date) {
      const room = `facility:${facilityId}:${date}`;
      socket.leave(room);
    }
  });

  // ── Team Chat rooms ──
  socket.on('join-team', ({ teamId }) => {
    if (teamId) {
      socket.join(`team:${teamId}`);
    }
  });

  socket.on('leave-team', ({ teamId }) => {
    if (teamId) {
      socket.leave(`team:${teamId}`);
    }
  });

  // ── User notification room ──
  socket.on('join-user', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on('leave-user', ({ userId }) => {
    if (userId) {
      socket.leave(`user:${userId}`);
    }
  });
});

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Cho phép mọi IP LAN 192.168.x.x
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Cho phép mọi IP LAN 10.x.x.x
  /^https:\/\/.*\.devtunnels\.ms$/,     // Cho phép devtunnels
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
app.set('trust proxy', 1); // Dùng req.ip đúng khi behind proxy (dev tunnel, nginx, etc.)
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
app.use('/api/news', require('./routes/news'));
app.use('/api/slot-views', require('./routes/slotViews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/owner', require('./routes/ownerAI'));
app.use('/api/admin', require('./routes/adminChat'));
app.use('/api/teams', require('./routes/teams'));

// Database connection
const { sequelize, syncDatabase } = require('./models');

// Test MySQL connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connection established successfully');

    const shouldAlter = process.env.DB_ALTER === 'true';
    const syncOptions = shouldAlter ? { alter: true } : {};
    if (shouldAlter) {
      console.log('⚠️ Running with ALTER mode - will modify tables to match models');
    }
    return syncDatabase(syncOptions);
  })
  .then(() => {
    // Background Cron: Auto-cancel pending_payment bookings after 15 minutes
    const clearPendingBookings = async () => {
      try {
        const { Op } = require('sequelize');
        const { Booking } = require('./models');
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

        const expiredBookings = await Booking.findAll({
          where: {
            status: 'pending_payment',
            createdAt: { [Op.lt]: fifteenMinsAgo }
          }
        });

        if (expiredBookings.length > 0) {
          console.log(`🧹 Found ${expiredBookings.length} expired pending_payment bookings. Cancelling...`);
          for (const b of expiredBookings) {
            await b.update({ status: 'cancelled' });
            console.log(`   - Cancelled booking #${b.id}`);
          }
        }
      } catch (err) {
        console.error('Error in background cron:', err.message);
      }
    };

    // Chạy mỗi 2 phút
    setInterval(clearPendingBookings, 2 * 60 * 1000);
    clearPendingBookings(); // Chạy ngay lúc start

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

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready for realtime connections`);
});
