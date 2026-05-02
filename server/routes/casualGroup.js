const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const CasualGroup = require('../models/CasualGroup');
const CasualGroupMember = require('../models/CasualGroupMember');
const User = require('../models/User');
const Sport = require('../models/Sport');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const GroupMessage = require('../models/GroupMessage');
const { createNotification } = require('./notifications');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Lấy ngày hôm nay theo giờ Việt Nam (UTC+7) để tránh lệch ngày khi so sánh
const getVNToday = () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().split('T')[0];
};

// Tạo system message + emit realtime
const createSystemMessage = async (groupId, content) => {
  try {
    const msg = await GroupMessage.create({
      groupId,
      userId: null, // system message không có user
      content,
      type: 'system'
    });
    if (global.io) {
      global.io.to(`group:${groupId}`).emit('group-message', {
        id: msg.id,
        groupId,
        userId: null,
        content,
        type: 'system',
        createdAt: msg.createdAt,
        sender: null
      });
    }
  } catch (err) {
    console.error('System message error:', err.message);
  }
};

// Emit sự kiện member thay đổi để client tự refresh
const emitMemberUpdate = (groupId) => {
  if (global.io) {
    global.io.to(`group:${groupId}`).emit('group-member-update', { groupId });
  }
};

// ─────────────────────────────────────────────
// Helper: include dùng chung cho queries
// ─────────────────────────────────────────────
const defaultIncludes = [
  { model: User, as: 'host', attributes: ['id', 'name', 'email', 'phone'] },
  { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image', 'emoji'] },
  { model: Facility, as: 'facility', attributes: ['id', 'name', 'address', 'phone', 'image'] },
  {
    model: CasualGroupMember, as: 'members',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
  }
];

// ═══════════════════════════════════════════════
// PUBLIC ROUTES (cần đăng nhập để xem chi tiết)
// ═══════════════════════════════════════════════

// GET /api/casual-groups — Danh sách phòng đang mở
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    where.status = req.query.status || 'open';

    if (req.query.sportId) {
      where.sportId = parseInt(req.query.sportId);
    }
    if (req.query.date) {
      where.date = req.query.date;
    }
    if (req.query.upcoming === 'true') {
      const today = getVNToday();
      where.date = { [Op.gte]: today };
    }
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } },
        { location: { [Op.like]: `%${req.query.search}%` } },
        { roomCode: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await CasualGroup.findAndCountAll({
      where,
      include: defaultIncludes,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit,
      offset
    });

    res.json({
      groups: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('CasualGroup list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/casual-groups/join/:roomCode — Tìm phòng bằng mã
router.get('/join/:roomCode', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findOne({
      where: { roomCode: req.params.roomCode.toUpperCase() },
      include: defaultIncludes
    });
    if (!group) {
      return res.status(404).json({ message: 'Không tìm thấy phòng với mã này' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/casual-groups/my/groups — Phòng tôi tạo + phòng tôi tham gia
router.get('/my/groups', auth, async (req, res) => {
  try {
    // Phòng tôi tạo
    const myGroups = await CasualGroup.findAll({
      where: { userId: req.user.id },
      include: defaultIncludes,
      order: [['createdAt', 'DESC']]
    });

    // Phòng tôi tham gia (không phải host)
    const myMemberships = await CasualGroupMember.findAll({
      where: { userId: req.user.id, isHost: false },
      include: [{
        model: CasualGroup, as: 'group',
        include: [
          { model: User, as: 'host', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image', 'emoji'] },
          { model: Facility, as: 'facility', attributes: ['id', 'name', 'address'] },
          {
            model: CasualGroupMember, as: 'members',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
          }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      created: myGroups,
      joined: myMemberships.map(m => m.group).filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ═══════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ═══════════════════════════════════════════════

// GET /api/casual-groups/my-eligible-bookings — Lấy lịch đặt sân hợp lệ của user để tạo phòng
// ⚠️ PHẢI đặt TRƯỚC route /:id để Express không match nhầm
router.get('/my-eligible-bookings', auth, async (req, res) => {
  try {
    const today = getVNToday();
    
    // Tìm các booking của user (dựa theo email)
    // - Trạng thái: confirmed
    // - Ngày: từ hôm nay trở đi
    // - Chưa được dùng để tạo phòng
    const bookings = await Booking.findAll({
      where: {
        customerEmail: req.user.email,
        status: 'confirmed',
        date: { [Op.gte]: today }
      },
      include: [
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] },
        { model: CasualGroup, as: 'casualGroups', attributes: ['id'] } // Để kiểm tra xem đã có phòng chưa
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });

    // Lọc bỏ những booking đã được tạo group
    const eligibleBookings = bookings.filter(b => !b.casualGroups || b.casualGroups.length === 0);

    res.json(eligibleBookings);
  } catch (error) {
    console.error('Fetch eligible bookings error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/casual-groups/:id — Chi tiết phòng
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id, { include: defaultIncludes });
    if (!group) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    // Sync currentPlayers với số member thực tế (phòng ngừa race condition)
    const actualCount = group.members ? group.members.length : 0;
    if (actualCount > 0 && actualCount !== group.currentPlayers) {
      await group.update({ currentPlayers: actualCount });
      group.currentPlayers = actualCount;
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/casual-groups — Tạo phòng mới
router.post('/', auth, async (req, res) => {
  try {
    const {
      bookingId, title, description, maxPlayers, contactPhone
    } = req.body;

    if (!bookingId || !title) {
      return res.status(400).json({ message: 'Vui lòng điền tiêu đề và chọn lịch đặt sân' });
    }

    // Kiểm tra booking hợp lệ
    const booking = await Booking.findOne({
      where: { 
        id: bookingId,
        customerEmail: req.user.email,
        status: 'confirmed'
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Lịch đặt sân không tồn tại hoặc không hợp lệ để tạo phòng' });
    }

    // Kiểm tra xem booking này đã tạo phòng chưa
    const existingGroup = await CasualGroup.findOne({ where: { bookingId } });
    if (existingGroup) {
      return res.status(400).json({ message: 'Lịch đặt sân này đã được dùng để tạo phòng' });
    }

    // Tạo phòng (sử dụng thông tin từ booking)
    const group = await CasualGroup.create({
      userId: req.user.id,
      bookingId: booking.id,
      sportId: booking.sportId,
      facilityId: null, // Booking lưu tên/địa chỉ, ta có thể không cần facilityId cứng
      title,
      description: description || null,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      maxPlayers: maxPlayers || 10,
      currentPlayers: 1,
      totalCost: booking.totalPrice, // Lấy giá từ booking
      contactPhone: contactPhone || req.user.phone || booking.customerPhone,
      location: booking.facilityName + (booking.facilityAddress ? ` (${booking.facilityAddress})` : ''),
      status: 'open'
    });

    // Tự động thêm chủ phòng làm member đầu tiên
    await CasualGroupMember.create({
      groupId: group.id,
      userId: req.user.id,
      isHost: true
    });

    const fullGroup = await CasualGroup.findByPk(group.id, { include: defaultIncludes });

    // 🔔 Thông báo tạo phòng thành công cho chủ phòng
    await createNotification({
      userId: req.user.id,
      type: 'group_created',
      title: 'Tạo phòng thành công!',
      message: `Phòng "${title}" đã được tạo. Mã phòng: ${group.roomCode}`,
      link: `/casual-group/${group.id}`
    });

    res.status(201).json(fullGroup);
  } catch (error) {
    console.error('CasualGroup create error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/casual-groups/:id — Sửa thông tin phòng (chỉ chủ phòng)
router.put('/:id', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    if (group.userId !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền sửa phòng này' });
    if (group.status === 'expired') return res.status(400).json({ message: 'Phòng đã hết hạn, không thể sửa' });

    const allowedFields = ['title', 'description', 'maxPlayers', 'contactPhone'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await group.update(updates);

    if (updates.maxPlayers) {
      if (group.currentPlayers >= updates.maxPlayers) {
        await group.update({ status: 'full' });
      } else if (group.status === 'full') {
        await group.update({ status: 'open' });
      }
    }

    const fullGroup = await CasualGroup.findByPk(group.id, { include: defaultIncludes });
    res.json(fullGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/casual-groups/:id/close — Đóng phòng
router.put('/:id/close', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    if (group.userId !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền đóng phòng này' });

    await group.update({ status: 'closed' });
    res.json({ message: 'Đã đóng phòng', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/casual-groups/:id/reopen — Mở lại phòng
router.put('/:id/reopen', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    if (group.userId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    if (group.status === 'expired') return res.status(400).json({ message: 'Phòng đã hết hạn' });

    const newStatus = group.currentPlayers >= group.maxPlayers ? 'full' : 'open';
    await group.update({ status: newStatus });
    res.json({ message: 'Đã mở lại phòng', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/casual-groups/:id — Xóa phòng (chủ phòng hoặc admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    if (group.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
    }

    await group.destroy();
    res.json({ message: 'Đã xóa phòng' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// JOIN / LEAVE / KICK
// ─────────────────────────────────────────────

// POST /api/casual-groups/:id/join — Tham gia phòng
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });

    if (group.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn là chủ phòng, không cần tham gia' });
    }
    if (group.status === 'full') return res.status(400).json({ message: 'Phòng đã đủ người' });
    if (group.status === 'closed') return res.status(400).json({ message: 'Phòng đã đóng' });
    if (group.status === 'expired') return res.status(400).json({ message: 'Phòng đã hết hạn' });

    const existing = await CasualGroupMember.findOne({
      where: { groupId: group.id, userId: req.user.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã tham gia phòng này rồi' });
    }

    await CasualGroupMember.create({
      groupId: group.id,
      userId: req.user.id,
      isHost: false
    });

    // Đếm lại member thực tế để đảm bảo chính xác
    const actualCount = await CasualGroupMember.count({ where: { groupId: group.id } });
    const updates = { currentPlayers: actualCount };
    if (actualCount >= group.maxPlayers) updates.status = 'full';
    await group.update(updates);

    // System message + realtime
    await createSystemMessage(group.id, `${req.user.name} đã tham gia phòng`);
    emitMemberUpdate(group.id);

    // 🔔 Thông báo cho host
    if (group.userId !== req.user.id) {
      await createNotification({
        userId: group.userId,
        type: 'group_join',
        title: 'Có người tham gia phòng',
        message: `${req.user.name} đã tham gia phòng "${group.title}"`,
        link: `/casual-group/${group.id}`
      });
    }

    const fullGroup = await CasualGroup.findByPk(group.id, { include: defaultIncludes });
    res.status(201).json({ message: 'Đã tham gia phòng thành công', group: fullGroup });
  } catch (error) {
    console.error('CasualGroup join error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/casual-groups/:id/leave — Rời phòng
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });

    if (group.userId === req.user.id) {
      return res.status(400).json({ message: 'Chủ phòng không thể rời phòng. Hãy xóa phòng nếu muốn.' });
    }

    const member = await CasualGroupMember.findOne({
      where: { groupId: group.id, userId: req.user.id }
    });
    if (!member) return res.status(404).json({ message: 'Bạn chưa tham gia phòng này' });

    await member.destroy();

    // Đếm lại member thực tế
    const actualCount = await CasualGroupMember.count({ where: { groupId: group.id } });
    const updates = { currentPlayers: Math.max(1, actualCount) };
    if (group.status === 'full' && actualCount < group.maxPlayers) updates.status = 'open';
    await group.update(updates);

    // System message + realtime
    await createSystemMessage(group.id, `${req.user.name} đã rời phòng`);
    emitMemberUpdate(group.id);

    // 🔔 Thông báo cho host
    if (group.userId !== req.user.id) {
      await createNotification({
        userId: group.userId,
        type: 'group_leave',
        title: 'Có người rời phòng',
        message: `${req.user.name} đã rời phòng "${group.title}"`,
        link: `/casual-group/${group.id}`
      });
    }

    res.json({ message: 'Đã rời phòng' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/casual-groups/:id/kick/:memberId — Kick thành viên (chủ phòng)
router.delete('/:id/kick/:memberId', auth, async (req, res) => {
  try {
    const group = await CasualGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    if (group.userId !== req.user.id) return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể kick' });

    const member = await CasualGroupMember.findByPk(req.params.memberId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });
    if (!member || member.groupId !== group.id) {
      return res.status(404).json({ message: 'Không tìm thấy thành viên này' });
    }
    if (member.isHost) {
      return res.status(400).json({ message: 'Không thể kick chủ phòng' });
    }

    const kickedName = member.user?.name || 'Thành viên';
    await member.destroy();

    // Đếm lại member thực tế
    const actualCount = await CasualGroupMember.count({ where: { groupId: group.id } });
    const updates = { currentPlayers: Math.max(1, actualCount) };
    if (group.status === 'full' && actualCount < group.maxPlayers) updates.status = 'open';
    await group.update(updates);

    // System message + realtime
    await createSystemMessage(group.id, `${kickedName} đã bị kick khỏi phòng`);
    emitMemberUpdate(group.id);

    // 🔔 Thông báo cho user bị kick
    if (member.userId) {
      await createNotification({
        userId: member.userId,
        type: 'group_kick',
        title: 'Bạn đã bị kick',
        message: `Bạn đã bị kick khỏi phòng "${group.title}"`,
        link: `/casual-group`
      });
    }

    res.json({ message: 'Đã kick thành viên' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// CHAT (Trò chuyện trong phòng)
// ─────────────────────────────────────────────

// Helper: kiểm tra user có phải thành viên phòng không
const isMemberOf = async (groupId, userId) => {
  const member = await CasualGroupMember.findOne({ where: { groupId, userId } });
  return !!member;
};

// GET /api/casual-groups/:id/messages — Lấy lịch sử tin nhắn
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);

    // Chỉ thành viên mới xem được tin nhắn
    if (!(await isMemberOf(groupId, req.user.id))) {
      return res.status(403).json({ message: 'Bạn chưa tham gia phòng này' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await GroupMessage.findAndCountAll({
      where: { groupId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      messages: rows.reverse(), // Trả về theo thứ tự cũ → mới
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/casual-groups/:id/messages — Gửi tin nhắn
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Tin nhắn không được trống' });
    }

    // Chỉ thành viên mới gửi được
    if (!(await isMemberOf(groupId, req.user.id))) {
      return res.status(403).json({ message: 'Bạn chưa tham gia phòng này' });
    }

    const message = await GroupMessage.create({
      groupId,
      userId: req.user.id,
      content: content.trim(),
      type: 'text'
    });

    // Lấy message kèm sender info
    const fullMessage = await GroupMessage.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
    });

    // Emit realtime qua Socket.IO
    if (global.io) {
      global.io.to(`group:${groupId}`).emit('group-message', fullMessage);
    }

    // 🔔 Thông báo cho tất cả member khác (trừ người gửi)
    try {
      const group = await CasualGroup.findByPk(groupId, { attributes: ['id', 'title'] });
      const members = await CasualGroupMember.findAll({
        where: { groupId, userId: { [Op.ne]: req.user.id } },
        attributes: ['userId']
      });
      const senderName = req.user.name || 'Thành viên';
      const groupTitle = group?.title || 'Group';
      const preview = content.trim().length > 50 ? content.trim().substring(0, 50) + '...' : content.trim();

      for (const m of members) {
        await createNotification({
          userId: m.userId,
          type: 'group_message',
          title: `Tin nhắn mới trong "${groupTitle}"`,
          message: `${senderName}: ${preview}`,
          link: `/casual-group/${groupId}`
        });
      }
    } catch (notifErr) {
      console.error('Chat notification error:', notifErr.message);
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
