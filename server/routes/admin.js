const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const { sendConfirmedBookingEmail } = require('../utils/emailService');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

// Get all bookings (Admin only)
router.get('/bookings', auth, admin, async (req, res) => {
  try {
    const { status, date, sportId } = req.query;
    let where = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      // Date is already in YYYY-MM-DD format
      where.date = date;
    }

    if (sportId) {
      where.sportId = sportId;
    }

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: Sport,
        as: 'sport'
      }],
      order: [
        ['createdAt', 'DESC']
      ],
      limit: 100
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get booking statistics
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const totalBookings = await Booking.count();
    const pendingBookings = await Booking.count({ where: { status: 'pending' } });
    const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
    const completedBookings = await Booking.count({ where: { status: 'completed' } });
    const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });

    // Calculate total revenue using Sequelize aggregate
    const revenueResult = await Booking.findAll({
      where: {
        status: {
          [Op.in]: ['confirmed', 'completed']
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'total']
      ],
      raw: true
    });

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: parseFloat(totalRevenue)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking status
router.put('/bookings/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.update({ status });

    // Fetch updated booking with sport info
    const updatedBooking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Sport,
        as: 'sport'
      }]
    });

    // Send confirmation email when status is changed to 'confirmed'
    if (status === 'confirmed') {
      const bookingData = updatedBooking.toJSON();
      sendConfirmedBookingEmail(bookingData)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Confirmation email sent to ${updatedBooking.customerEmail}`);
          } else {
            console.error(`⚠️ Failed to send confirmation email to ${updatedBooking.customerEmail}:`, result.error);
          }
        })
        .catch((error) => {
          console.error(`⚠️ Confirmation email sending error for ${updatedBooking.customerEmail}:`, error.message);
        });
    }

    // Send completion email when status is changed to 'completed'
    if (status === 'completed') {
      const bookingData = updatedBooking.toJSON();
      const { sendCompletedBookingEmail } = require('../utils/emailService');
      sendCompletedBookingEmail(bookingData)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Completion email sent to ${updatedBooking.customerEmail}`);
          } else {
            console.error(`⚠️ Failed to send completion email to ${updatedBooking.customerEmail}:`, result.error);
          }
        })
        .catch((error) => {
          console.error(`⚠️ Completion email sending error for ${updatedBooking.customerEmail}:`, error.message);
        });
    }

    res.json(updatedBooking);

    // 🔔 Thông báo realtime cho user khi admin thay đổi trạng thái
    try {
      const { createNotification } = require('./notifications');
      const owner = await User.findOne({ where: { email: booking.customerEmail } });
      if (owner) {
        const sportName = updatedBooking.sport?.nameVi || updatedBooking.sport?.name || '';
        if (status === 'confirmed') {
          await createNotification({
            userId: owner.id,
            type: 'booking_confirmed',
            title: 'Đặt sân đã xác nhận',
            message: `Booking #${booking.id} (${sportName} - ${booking.facilityName}) đã được xác nhận`,
            link: '/bookings'
          });
        } else if (status === 'cancelled') {
          await createNotification({
            userId: owner.id,
            type: 'booking_cancelled',
            title: 'Đặt sân đã bị hủy',
            message: `Booking #${booking.id} (${sportName} - ${booking.facilityName}) đã bị hủy bởi admin`,
            link: '/bookings'
          });
        } else if (status === 'completed') {
          await createNotification({
            userId: owner.id,
            type: 'booking_completed',
            title: 'Đặt sân đã hoàn thành',
            message: `Booking #${booking.id} (${sportName} - ${booking.facilityName}) đã hoàn thành. Cảm ơn bạn!`,
            link: '/bookings'
          });
        }
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete booking
router.delete('/bookings/:id', auth, admin, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.destroy();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all sports (for admin)
router.get('/sports', auth, admin, async (req, res) => {
  try {
    const sports = await Sport.findAll();
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -- FIND MATE MANAGEMENT --

// Get all find mate posts (for admin)
router.get('/findmates', auth, admin, async (req, res) => {
  try {
    const FindMate = require('../models/FindMate');
    const FindMateJoin = require('../models/FindMateJoin');
    const Facility = require('../models/Facility');
    const findmates = await FindMate.findAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] },
        { model: Facility, as: 'facility', attributes: ['id', 'name', 'address'] },
        { model: FindMateJoin, as: 'joins', include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
        ]}
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(findmates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update find mate approval status
router.put('/findmates/:id/approve', auth, admin, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const FindMate = require('../models/FindMate');
    
    const post = await FindMate.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }

    await post.update({ isApproved });
    
    // Return updated post
    const updatedPost = await FindMate.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi'] }
      ]
    });
    
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// -- OWNER REQUEST MANAGEMENT --

// Get all owner registration requests
router.get('/owner-requests', auth, admin, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const where = { role: 'owner' };
    if (status !== 'all') where.ownerStatus = status;

    const owners = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or reject owner request
router.put('/owner-requests/:id', auth, admin, async (req, res) => {
  try {
    const { ownerStatus, ownerNote } = req.body;

    if (!['approved', 'rejected'].includes(ownerStatus)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (user.role !== 'owner') return res.status(400).json({ message: 'User này không phải chủ sân' });

    await user.update({
      ownerStatus,
      ownerNote: ownerNote || null
    });

    const updated = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -- FACILITY APPROVAL --

// Get facilities pending approval
router.get('/pending-facilities', auth, admin, async (req, res) => {
  try {
    const Facility = require('../models/Facility');
    const Sport = require('../models/Sport');
    const filter = req.query.filter || 'pending'; // pending | approved | all
    const where = {};
    if (filter === 'pending') where.isApproved = false;
    else if (filter === 'approved') where.isApproved = true;

    const facilities = await Facility.findAll({
      where,
      include: [
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or reject a facility
router.put('/facilities/:id/approve', auth, admin, async (req, res) => {
  try {
    const Facility = require('../models/Facility');
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Không tìm thấy sân' });

    const { isApproved } = req.body;
    await facility.update({ isApproved: !!isApproved });

    res.json({ message: isApproved ? 'Đã duyệt sân' : 'Đã từ chối sân', facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

