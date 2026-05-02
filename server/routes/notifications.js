const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────
// Helper: Tạo notification + push realtime
// ─────────────────────────────────────────────
const createNotification = async ({ userId, type, title, message, link }) => {
  try {
    const notification = await Notification.create({
      userId, type, title, message, link
    });

    // Push realtime qua Socket.IO
    if (global.io) {
      global.io.to(`user:${userId}`).emit('new-notification', {
        id: notification.id,
        type,
        title,
        message,
        link,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (err) {
    console.error('Create notification error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

// GET /api/notifications — Danh sách thông báo của user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (req.query.unread === 'true') {
      where.isRead = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      notifications: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/notifications/unread-count — Đếm số chưa đọc
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    await notification.update({ isRead: true });
    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/notifications/:id — Xóa thông báo
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    await notification.destroy();
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
