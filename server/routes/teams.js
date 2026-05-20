const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Sport = require('../models/Sport');
const TeamMessage = require('../models/TeamMessage');
const { createNotification } = require('./notifications');

// ─────────────────────────────────────────────
// Helper: include dùng chung cho queries
// ─────────────────────────────────────────────
const defaultIncludes = [
  { model: User, as: 'captain', attributes: ['id', 'name', 'email', 'phone', 'avatar'] },
  { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image', 'emoji'] },
  {
    model: TeamMember, as: 'members',
    where: { status: 'accepted' },
    required: false,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar'] }]
  }
];

// Include tất cả members (kể cả pending) - cho captain xem
const allMembersIncludes = [
  { model: User, as: 'captain', attributes: ['id', 'name', 'email', 'phone', 'avatar'] },
  { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image', 'emoji'] },
  {
    model: TeamMember, as: 'members',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar'] }]
  }
];

// ═══════════════════════════════════════════════
// PUBLIC ROUTES (cần đăng nhập)
// ═══════════════════════════════════════════════

// GET /api/teams — Danh sách đội (filter: sportId, search, pagination)
router.get('/', async (req, res) => {
  try {
    const where = { status: 'active' };

    if (req.query.sportId) {
      where.sportId = parseInt(req.query.sportId);
    }

    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } },
        { slogan: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await Team.findAndCountAll({
      where,
      include: defaultIncludes,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true // Tránh đếm trùng do JOIN
    });

    res.json({
      teams: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Team list error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teams/my/teams — Đội của tôi (tạo + tham gia)
// ⚠️ PHẢI đặt TRƯỚC route /:id
router.get('/my/teams', auth, async (req, res) => {
  try {
    // Đội tôi tạo (là captain)
    const myTeams = await Team.findAll({
      where: { userId: req.user.id },
      include: defaultIncludes,
      order: [['createdAt', 'DESC']]
    });

    // Đội tôi tham gia (không phải captain)
    const myMemberships = await TeamMember.findAll({
      where: { userId: req.user.id, role: 'member', status: 'accepted' },
      include: [{
        model: Team, as: 'team',
        include: [
          { model: User, as: 'captain', attributes: ['id', 'name', 'email', 'phone', 'avatar'] },
          { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'image', 'emoji'] },
          {
            model: TeamMember, as: 'members',
            where: { status: 'accepted' },
            required: false,
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar'] }]
          }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      created: myTeams,
      joined: myMemberships.map(m => m.team).filter(Boolean)
    });
  } catch (error) {
    console.error('My teams error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teams/:id — Chi tiết đội
router.get('/:id', auth, async (req, res) => {
  try {
    // Nếu user là captain, cho xem tất cả members (kể cả pending)
    const team = await Team.findByPk(req.params.id, { include: allMembersIncludes });
    if (!team) {
      return res.status(404).json({ message: 'Không tìm thấy đội' });
    }

    // Sync currentMembers
    const acceptedCount = team.members ? team.members.filter(m => m.status === 'accepted').length : 0;
    if (acceptedCount > 0 && acceptedCount !== team.currentMembers) {
      await team.update({ currentMembers: acceptedCount });
      team.currentMembers = acceptedCount;
    }

    res.json(team);
  } catch (error) {
    console.error('Team detail error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ═══════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ═══════════════════════════════════════════════

// POST /api/teams — Tạo đội mới
router.post('/', auth, async (req, res) => {
  try {
    const { sportId, name, description, slogan, image, maxMembers } = req.body;

    if (!sportId || !name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đội và chọn môn thể thao' });
    }

    // Kiểm tra sport tồn tại
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Môn thể thao không tồn tại' });
    }

    // Tạo đội
    const team = await Team.create({
      userId: req.user.id,
      sportId,
      name,
      description: description || null,
      slogan: slogan || null,
      image: image || null,
      maxMembers: maxMembers || 20,
      currentMembers: 1,
      status: 'active'
    });

    // Tự động thêm đội trưởng làm member đầu tiên
    await TeamMember.create({
      teamId: team.id,
      userId: req.user.id,
      role: 'captain',
      status: 'accepted'
    });

    const fullTeam = await Team.findByPk(team.id, { include: defaultIncludes });

    // 🔔 Thông báo tạo đội thành công
    await createNotification({
      userId: req.user.id,
      type: 'system',
      title: 'Tạo đội thành công!',
      message: `Đội "${name}" đã được tạo thành công.`,
      link: `/teams/${team.id}`
    });

    res.status(201).json(fullTeam);
  } catch (error) {
    console.error('Team create error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/teams/:id — Sửa thông tin đội (chỉ đội trưởng)
router.put('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });
    if (team.userId !== req.user.id) return res.status(403).json({ message: 'Chỉ đội trưởng mới có quyền sửa' });

    const allowedFields = ['name', 'description', 'slogan', 'image', 'maxMembers', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await team.update(updates);
    const fullTeam = await Team.findByPk(team.id, { include: defaultIncludes });
    res.json(fullTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/teams/:id — Xóa đội (đội trưởng hoặc admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });
    if (team.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đội này' });
    }

    await team.destroy();
    res.json({ message: 'Đã xóa đội' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// JOIN / LEAVE / APPROVE / KICK
// ─────────────────────────────────────────────

// POST /api/teams/:id/join — Xin vào đội
router.post('/:id/join', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });

    if (team.userId === req.user.id) {
      return res.status(400).json({ message: 'Bạn là đội trưởng, không cần xin vào' });
    }

    if (team.status === 'inactive') {
      return res.status(400).json({ message: 'Đội đã ngừng hoạt động' });
    }

    // Kiểm tra số lượng thành viên
    const acceptedCount = await TeamMember.count({
      where: { teamId: team.id, status: 'accepted' }
    });
    if (acceptedCount >= team.maxMembers) {
      return res.status(400).json({ message: 'Đội đã đủ thành viên' });
    }

    // Kiểm tra đã xin vào chưa
    const existing = await TeamMember.findOne({
      where: { teamId: team.id, userId: req.user.id }
    });
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'Bạn đã là thành viên đội này' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Bạn đã gửi yêu cầu, đang chờ duyệt' });
      }
      // Nếu bị rejected trước đó, cho phép xin lại
      await existing.update({ status: 'pending' });
    } else {
      await TeamMember.create({
        teamId: team.id,
        userId: req.user.id,
        role: 'member',
        status: 'pending'
      });
    }

    // 🔔 Thông báo cho đội trưởng
    await createNotification({
      userId: team.userId,
      type: 'system',
      title: 'Yêu cầu vào đội',
      message: `${req.user.name} muốn tham gia đội "${team.name}"`,
      link: `/teams/${team.id}`
    });

    res.status(201).json({ message: 'Đã gửi yêu cầu tham gia. Đội trưởng sẽ duyệt.' });
  } catch (error) {
    console.error('Team join error:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/teams/:id/members/:memberId — Duyệt/từ chối thành viên (đội trưởng)
router.put('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });
    if (team.userId !== req.user.id) return res.status(403).json({ message: 'Chỉ đội trưởng mới có quyền duyệt' });

    const member = await TeamMember.findByPk(req.params.memberId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });
    if (!member || member.teamId !== team.id) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }

    const { status } = req.body; // 'accepted' hoặc 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status phải là accepted hoặc rejected' });
    }

    if (status === 'accepted') {
      // Kiểm tra còn chỗ không
      const acceptedCount = await TeamMember.count({
        where: { teamId: team.id, status: 'accepted' }
      });
      if (acceptedCount >= team.maxMembers) {
        return res.status(400).json({ message: 'Đội đã đủ thành viên' });
      }

      await member.update({ status: 'accepted' });

      // Cập nhật currentMembers
      const newCount = await TeamMember.count({
        where: { teamId: team.id, status: 'accepted' }
      });
      await team.update({ currentMembers: newCount });

      // 🔔 Thông báo cho người được duyệt
      await createNotification({
        userId: member.userId,
        type: 'system',
        title: 'Đã được chấp nhận!',
        message: `Bạn đã được chấp nhận vào đội "${team.name}"`,
        link: `/teams/${team.id}`
      });
    } else {
      await member.update({ status: 'rejected' });

      // 🔔 Thông báo cho người bị từ chối
      await createNotification({
        userId: member.userId,
        type: 'system',
        title: 'Yêu cầu bị từ chối',
        message: `Yêu cầu tham gia đội "${team.name}" đã bị từ chối`,
        link: `/teams`
      });
    }

    const fullMember = await TeamMember.findByPk(member.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar'] }]
    });

    res.json({ message: status === 'accepted' ? 'Đã duyệt' : 'Đã từ chối', member: fullMember });
  } catch (error) {
    console.error('Team approve error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/teams/:id/leave — Rời đội
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });

    if (team.userId === req.user.id) {
      return res.status(400).json({ message: 'Đội trưởng không thể rời đội. Hãy xóa đội nếu muốn.' });
    }

    const member = await TeamMember.findOne({
      where: { teamId: team.id, userId: req.user.id, status: 'accepted' }
    });
    if (!member) return res.status(404).json({ message: 'Bạn chưa phải thành viên đội này' });

    await member.destroy();

    // Cập nhật currentMembers
    const newCount = await TeamMember.count({
      where: { teamId: team.id, status: 'accepted' }
    });
    await team.update({ currentMembers: Math.max(1, newCount) });

    // 🔔 Thông báo cho đội trưởng
    await createNotification({
      userId: team.userId,
      type: 'system',
      title: 'Thành viên rời đội',
      message: `${req.user.name} đã rời đội "${team.name}"`,
      link: `/teams/${team.id}`
    });

    res.json({ message: 'Đã rời đội' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/teams/:id/kick/:memberId — Kick thành viên (đội trưởng)
router.delete('/:id/kick/:memberId', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });
    if (team.userId !== req.user.id) return res.status(403).json({ message: 'Chỉ đội trưởng mới có thể kick' });

    const member = await TeamMember.findByPk(req.params.memberId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });
    if (!member || member.teamId !== team.id) {
      return res.status(404).json({ message: 'Không tìm thấy thành viên' });
    }
    if (member.role === 'captain') {
      return res.status(400).json({ message: 'Không thể kick đội trưởng' });
    }

    const kickedName = member.user?.name || 'Thành viên';
    const kickedUserId = member.userId;
    await member.destroy();

    // Cập nhật currentMembers
    const newCount = await TeamMember.count({
      where: { teamId: team.id, status: 'accepted' }
    });
    await team.update({ currentMembers: Math.max(1, newCount) });

    // 🔔 Thông báo cho user bị kick
    await createNotification({
      userId: kickedUserId,
      type: 'system',
      title: 'Bạn đã bị kick',
      message: `Bạn đã bị loại khỏi đội "${team.name}"`,
      link: `/teams`
    });

    res.json({ message: `Đã kick ${kickedName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// CHAT REAL-TIME
// ─────────────────────────────────────────────

// GET /api/teams/:id/messages — Lấy lịch sử chat
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });

    // Kiểm tra xem user có phải đội trưởng hoặc thành viên đã duyệt không
    const isCaptain = team.userId === req.user.id;
    const isMember = await TeamMember.findOne({
      where: { teamId: team.id, userId: req.user.id, status: 'accepted' }
    });

    if (!isCaptain && !isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập đoạn chat của đội này' });
    }

    const messages = await TeamMessage.findAll({
      where: { teamId: team.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Fetch team messages error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/teams/:id/messages — Gửi tin nhắn mới
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ message: 'Không tìm thấy đội' });

    // Kiểm tra xem user có phải đội trưởng hoặc thành viên đã duyệt không
    const isCaptain = team.userId === req.user.id;
    const isMember = await TeamMember.findOne({
      where: { teamId: team.id, userId: req.user.id, status: 'accepted' }
    });

    if (!isCaptain && !isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền chat trong đội này' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống' });
    }

    const newMessage = await TeamMessage.create({
      teamId: team.id,
      userId: req.user.id,
      message: message.trim()
    });

    const fullMessage = await TeamMessage.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }
      ]
    });

    // Phát socket thời gian thực
    if (global.io) {
      global.io.to(`team:${team.id}`).emit('team-message', fullMessage);
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Send team message error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
