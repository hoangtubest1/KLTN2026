const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const FindMate = require('../models/FindMate');
const FindMateJoin = require('../models/FindMateJoin');
const User = require('../models/User');
const Sport = require('../models/Sport');
const Facility = require('../models/Facility');

// ─────────────────────────────────────────────
// Helper: include dùng chung cho queries
// ─────────────────────────────────────────────
const defaultIncludes = [
  { model: User, as: 'author', attributes: ['id', 'name', 'email', 'phone'] },
  { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image'] },
  { model: Facility, as: 'facility', attributes: ['id', 'name', 'address', 'phone', 'image'] },
  {
    model: FindMateJoin, as: 'joins',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
  }
];

// ═══════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════

// GET /api/findmate — Danh sách bài đăng (filter: sportId, date, status, search)
router.get('/', async (req, res) => {
  try {
    const where = {};

    // Mặc định chỉ hiển thị bài đang mở và đã được duyệt
    where.status = req.query.status || 'open';
    where.isApproved = true;

    // Filter theo môn thể thao
    if (req.query.sportId) {
      where.sportId = parseInt(req.query.sportId);
    }

    // Filter theo ngày
    if (req.query.date) {
      where.date = req.query.date;
    }

    // Filter theo ngày (từ hôm nay trở đi)
    if (req.query.upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      where.date = { [Op.gte]: today };
    }

    // Tìm kiếm theo tiêu đề hoặc mô tả
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } },
        { location: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    // Filter theo trình độ
    if (req.query.skillLevel && req.query.skillLevel !== 'any') {
      where.skillLevel = req.query.skillLevel;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await FindMate.findAndCountAll({
      where,
      include: defaultIncludes,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit,
      offset
    });

    res.json({
      posts: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('FindMate list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/findmate/:id — Chi tiết bài đăng
router.get('/:id', async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id, { include: defaultIncludes });
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ═══════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ═══════════════════════════════════════════════

// POST /api/findmate — Tạo bài đăng tìm bạn
router.post('/', auth, async (req, res) => {
  try {
    const {
      sportId, facilityId, title, description,
      date, startTime, endTime, maxPlayers,
      contactPhone, location, skillLevel
    } = req.body;

    // Validation
    if (!sportId || !title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Kiểm tra sport tồn tại
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Môn thể thao không tồn tại' });
    }

    // Kiểm tra ngày không phải quá khứ
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ message: 'Không thể đăng bài cho ngày trong quá khứ' });
    }

    // Kiểm tra facility nếu có
    if (facilityId) {
      const facility = await Facility.findByPk(facilityId);
      if (!facility) {
        return res.status(404).json({ message: 'Sân bãi không tồn tại' });
      }
    }

    const post = await FindMate.create({
      userId: req.user.id,
      sportId,
      facilityId: facilityId || null,
      title,
      description: description || null,
      date,
      startTime,
      endTime,
      maxPlayers: maxPlayers || 10,
      currentPlayers: 1, // Chủ bài = 1 người
      contactPhone: contactPhone || req.user.phone || null,
      location: location || null,
      skillLevel: skillLevel || 'any',
      status: 'open',
      isApproved: false // Bài mới cần duyệt
    });

    // Fetch full data
    const fullPost = await FindMate.findByPk(post.id, { include: defaultIncludes });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error('FindMate create error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/findmate/:id — Sửa bài đăng (chỉ chủ bài)
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền sửa bài này' });
    if (post.status === 'expired') return res.status(400).json({ message: 'Bài đã hết hạn, không thể sửa' });

    const allowedFields = ['title', 'description', 'date', 'startTime', 'endTime', 'maxPlayers', 'contactPhone', 'location', 'skillLevel', 'sportId', 'facilityId'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await post.update(updates);

    // Cập nhật status nếu maxPlayers thay đổi
    if (updates.maxPlayers) {
      if (post.currentPlayers >= updates.maxPlayers) {
        await post.update({ status: 'full' });
      } else if (post.status === 'full') {
        await post.update({ status: 'open' });
      }
    }

    const fullPost = await FindMate.findByPk(post.id, { include: defaultIncludes });
    res.json(fullPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/findmate/:id/close — Đóng bài đăng
router.put('/:id/close', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền đóng bài này' });

    await post.update({ status: 'closed' });
    res.json({ message: 'Đã đóng bài đăng', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/findmate/:id/reopen — Mở lại bài đăng
router.put('/:id/reopen', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    if (post.status === 'expired') return res.status(400).json({ message: 'Bài đã hết hạn' });

    const newStatus = post.currentPlayers >= post.maxPlayers ? 'full' : 'open';
    await post.update({ status: newStatus });
    res.json({ message: 'Đã mở lại bài đăng', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/findmate/:id — Xoá bài đăng (chủ bài hoặc admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xoá bài này' });
    }

    await post.destroy();
    res.json({ message: 'Đã xoá bài đăng' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// JOIN / LEAVE / ACCEPT / REJECT
// ─────────────────────────────────────────────

// POST /api/findmate/:id/join — Đăng ký tham gia
router.post('/:id/join', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

    // Không cho tham gia bài của chính mình
    if (post.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tham gia bài đăng của chính mình' });
    }

    // Kiểm tra trạng thái bài
    if (post.status === 'full') return res.status(400).json({ message: 'Bài đăng đã đủ người' });
    if (post.status === 'closed') return res.status(400).json({ message: 'Bài đăng đã đóng' });
    if (post.status === 'expired') return res.status(400).json({ message: 'Bài đăng đã hết hạn' });

    // Kiểm tra đã đăng ký chưa
    const existing = await FindMateJoin.findOne({
      where: { findMateId: post.id, userId: req.user.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã đăng ký tham gia bài này rồi' });
    }

    const join = await FindMateJoin.create({
      findMateId: post.id,
      userId: req.user.id,
      message: req.body.message || null,
      status: 'pending' // Chờ duyệt
    });

    const fullJoin = await FindMateJoin.findByPk(join.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    res.status(201).json({ message: 'Đã gửi yêu cầu tham gia', join: fullJoin });
  } catch (error) {
    console.error('FindMate join error:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/findmate/:id/join/:joinId — Duyệt/từ chối (chủ bài)
router.put('/:id/join/:joinId', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id) return res.status(403).json({ message: 'Chỉ chủ bài mới có thể duyệt' });

    const join = await FindMateJoin.findByPk(req.params.joinId);
    if (!join || join.findMateId !== post.id) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tham gia' });
    }

    const { status } = req.body; // 'accepted' hoặc 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status phải là accepted hoặc rejected' });
    }

    // Nếu duyệt, kiểm tra còn chỗ không
    if (status === 'accepted') {
      if (post.currentPlayers >= post.maxPlayers) {
        return res.status(400).json({ message: 'Đã đủ người, không thể duyệt thêm' });
      }

      await join.update({ status: 'accepted' });

      // Tăng currentPlayers
      const newCount = post.currentPlayers + 1;
      const updates = { currentPlayers: newCount };
      if (newCount >= post.maxPlayers) updates.status = 'full';
      await post.update(updates);
    } else {
      await join.update({ status: 'rejected' });
    }

    const fullJoin = await FindMateJoin.findByPk(join.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    res.json({ message: status === 'accepted' ? 'Đã duyệt' : 'Đã từ chối', join: fullJoin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/findmate/:id/join — Huỷ đăng ký tham gia (user tự huỷ)
router.delete('/:id/join', auth, async (req, res) => {
  try {
    const post = await FindMate.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });

    const join = await FindMateJoin.findOne({
      where: { findMateId: post.id, userId: req.user.id }
    });
    if (!join) return res.status(404).json({ message: 'Bạn chưa đăng ký bài này' });

    // Nếu đã được duyệt, giảm currentPlayers
    if (join.status === 'accepted') {
      const newCount = Math.max(1, post.currentPlayers - 1);
      const updates = { currentPlayers: newCount };
      if (post.status === 'full' && newCount < post.maxPlayers) updates.status = 'open';
      await post.update(updates);
    }

    await join.destroy();
    res.json({ message: 'Đã huỷ đăng ký tham gia' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// MY POSTS / MY JOINS
// ─────────────────────────────────────────────

// GET /api/findmate/my/posts — Bài đăng của tôi
router.get('/my/posts', auth, async (req, res) => {
  try {
    const posts = await FindMate.findAll({
      where: { userId: req.user.id },
      include: defaultIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/findmate/my/joins — Bài tôi đã đăng ký tham gia
router.get('/my/joins', auth, async (req, res) => {
  try {
    const joins = await FindMateJoin.findAll({
      where: { userId: req.user.id },
      include: [{
        model: FindMate, as: 'findMate',
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image'] },
          { model: Facility, as: 'facility', attributes: ['id', 'name', 'address'] }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(joins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
