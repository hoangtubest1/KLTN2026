const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const Facility = require('../models/Facility');
const { body, validationResult } = require('express-validator');
const { auth, admin } = require('../middleware/auth');
const { sendBookingConfirmationEmail, sendConfirmedBookingEmail } = require('../utils/emailService');
const { Op } = require('sequelize'); // Import Sequelize operators
const { createNotification } = require('./notifications');

// Helper: emit slot status change to all viewers of a facility+date room
const emitSlotUpdate = async (facilityName, date, startTime, endTime, status) => {
  try {
    // Find facility by name to get facilityId for the room
    const fac = await Facility.findOne({ where: { name: facilityName } });
    if (fac && global.io) {
      const room = `facility:${fac.id}:${date}`;
      global.io.to(room).emit('slot-update', {
        facilityName,
        date,
        startTime,
        endTime,
        status, // 'pending_payment', 'cancelled', 'pending', 'confirmed'
      });
      console.log(`📡 Socket emit slot-update to ${room}: ${startTime}-${endTime} → ${status}`);
    }
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};

// Get all bookings (with optional user filter)
// Note: This route is public but will filter by user email if token is provided
router.get('/', async (req, res) => {
  try {
    const where = {};
    // If Authorization header exists, try to get user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findByPk(decoded.userId);
        if (user && user.role !== 'admin') {
          // Always filter by user email for non-admin users
          where.customerEmail = user.email;
        }
      } catch (err) {
        // Invalid token, continue without filter
      }
    }

    // Filter by date if provided - use literal to avoid timezone issues with DATEONLY
    if (req.query.date) {
      const { Op } = require('sequelize');
      const { sequelize: seq } = require('../config/database');
      where.date = seq.where(seq.fn('DATE', seq.col('date')), req.query.date);
    }

    // Filter by sportId if provided
    if (req.query.sportId) {
      where.sportId = parseInt(req.query.sportId);
    }

    // Filter by facilityId (matches facilityName) if provided
    if (req.query.facilityId) {
      const Facility = require('../models/Facility');
      try {
        const fac = await Facility.findByPk(req.query.facilityId);
        if (fac) {
          where.facilityName = fac.name;
        }
      } catch (_) {}
    }

    // Filter by status if provided
    if (req.query.status) {
      where.status = req.query.status;
    }

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: Sport,
        as: 'sport'
      }],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings by date
router.get('/date/:date', async (req, res) => {
  try {
    const date = req.params.date; // Format: YYYY-MM-DD

    const bookings = await Booking.findAll({
      where: {
        date: date
      },
      include: [{
        model: Sport,
        as: 'sport'
      }]
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hold a slot temporarily (pending_payment) when user enters checkout page
router.post('/hold', auth, async (req, res) => {
  try {
    const { sportId, facilityName, facilityAddress, facilityPhone, date, startTime, endTime } = req.body;

    if (!sportId || !facilityName || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Thiếu thông tin giữ chỗ' });
    }

    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Môn thể thao không tồn tại' });
    }

    // Cancel any existing hold by this user for this same slot
    await Booking.update(
      { status: 'cancelled' },
      {
        where: {
          sportId,
          facilityName,
          date,
          startTime,
          endTime,
          customerEmail: req.user.email,
          status: 'pending_payment'
        }
      }
    );

    // Check for conflicts (pending/confirmed/pending_payment by others)
    const existingBooking = await Booking.findOne({
      where: {
        sportId,
        facilityName,
        date,
        status: { [Op.in]: ['pending', 'confirmed', 'pending_payment'] },
        [Op.or]: [{
          [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
          ]
        }]
      }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Khung giờ này đã được đặt hoặc đang giữ chỗ' });
    }

    // Calculate price
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60);
    const totalPrice = duration * sport.pricePerHour;

    const booking = await Booking.create({
      sportId,
      facilityName,
      facilityAddress: facilityAddress || '',
      facilityPhone: facilityPhone || '',
      customerName: req.user.name,
      customerPhone: req.user.phone,
      customerEmail: req.user.email,
      date,
      startTime,
      endTime,
      duration,
      totalPrice,
      status: 'pending_payment',
      paymentMethod: 'hold',
      paymentStatus: 'unpaid',
    });

    console.log(`🔒 Slot held: Booking #${booking.id} (${facilityName} ${date} ${startTime}-${endTime}) by ${req.user.email}`);

    // Realtime: notify all viewers of this facility+date
    emitSlotUpdate(facilityName, date, startTime, endTime, 'pending_payment');

    res.status(201).json(booking);
  } catch (error) {
    console.error('Hold slot error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Release a held slot
router.delete('/hold/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }
    // Only the owner can release, and only if still pending_payment
    if (booking.customerEmail !== req.user.email || booking.status !== 'pending_payment') {
      return res.status(403).json({ message: 'Không có quyền' });
    }
    await booking.update({ status: 'cancelled' });
    console.log(`🔓 Slot released: Booking #${booking.id}`);

    // Realtime: notify all viewers
    emitSlotUpdate(booking.facilityName, booking.date, booking.startTime, booking.endTime, 'cancelled');

    res.json({ message: 'Đã hủy giữ chỗ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Beacon release (for tab close — sendBeacon only supports POST)
router.post('/hold/:id/beacon', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(401).end();

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);
    const User = require('../models/User');
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(401).end();

    const booking = await Booking.findByPk(req.params.id);
    if (booking && booking.customerEmail === user.email && booking.status === 'pending_payment') {
      await booking.update({ status: 'cancelled' });
      console.log(`🔓 Beacon release: Booking #${booking.id}`);

      // Realtime: notify all viewers
      emitSlotUpdate(booking.facilityName, booking.date, booking.startTime, booking.endTime, 'cancelled');
    }
    res.status(204).end();
  } catch (error) {
    res.status(204).end();
  }
});

// Get single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Sport,
        as: 'sport'
      }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking
router.post('/', auth, [
  body('customerName').notEmpty().withMessage('Tên khách hàng là bắt buộc'),
  body('customerPhone').notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('customerEmail').isEmail().withMessage('Email không hợp lệ'),
  body('date').notEmpty().withMessage('Ngày đặt là bắt buộc'),
  body('startTime').notEmpty().withMessage('Giờ bắt đầu là bắt buộc'),
  body('endTime').notEmpty().withMessage('Giờ kết thúc là bắt buộc'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sportId, facilityName, facilityAddress, facilityPhone, customerName, customerPhone, customerEmail, date, startTime, endTime, notes, couponCode, discountAmount } = req.body;

    // Check if sport exists
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Môn thể thao không tồn tại' });
    }

    // Check for conflicts
    // Sequelize: Check if there's an overlapping booking
    const existingBooking = await Booking.findOne({
      where: {
        sportId,
        facilityName,
        date: date,
        status: {
          [Op.in]: ['pending', 'confirmed', 'pending_payment']
        },
        [Op.or]: [
          {
            [Op.and]: [
              { startTime: { [Op.lt]: endTime } },
              { endTime: { [Op.gt]: startTime } }
            ]
          }
        ]
      }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Khung giờ này đã được đặt' });
    }

    // Calculate duration and price
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    const totalPrice = duration * sport.pricePerHour;

    const booking = await Booking.create({
      sportId,
      facilityName,
      facilityAddress: facilityAddress || '',
      facilityPhone: facilityPhone || '',
      customerName,
      customerPhone,
      customerEmail,
      date: date,
      startTime,
      endTime,
      duration,
      totalPrice,
      notes,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
      status: 'pending'
    });

    // Nếu có xài mã giảm giá, tăng lượt dùng
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ where: { code: couponCode } });
      if (coupon) {
        await coupon.increment('currentUses');
      }
    }

    // Fetch with sport info
    const populatedBooking = await Booking.findByPk(booking.id, {
      include: [{
        model: Sport,
        as: 'sport'
      }]
    });

    // Send confirmation email (don't block if email fails)
    // Convert to plain JSON so associations (sport) are accessible in email template
    const bookingData = populatedBooking.toJSON();
    console.log(`\n📧 Booking #${bookingData.id} created. Sending email to: ${bookingData.customerEmail}`);
    console.log(`   Sport: ${bookingData.sport?.nameVi || bookingData.sport?.name || 'N/A'}`);
    console.log(`   Facility: ${bookingData.facilityName}, Date: ${bookingData.date}`);
    sendBookingConfirmationEmail(bookingData)
      .then((result) => {
        if (result.success) {
          console.log(`✅ Confirmation email sent to ${customerEmail}, messageId: ${result.messageId}`);
        } else {
          console.error(`⚠️ Failed to send email to ${customerEmail}:`, result.error);
        }
      })
      .catch((error) => {
        console.error(`⚠️ Email sending error for ${customerEmail}:`, error.message);
      });

    res.status(201).json(populatedBooking);

    // Realtime: notify slot is now booked (pending)
    emitSlotUpdate(facilityName, date, startTime, endTime, 'pending');

    // 🔔 Thông báo realtime cho user
    try {
      const sportName = populatedBooking.sport?.nameVi || populatedBooking.sport?.name || '';
      await createNotification({
        userId: req.user.id,
        type: 'booking_confirmed',
        title: 'Đặt sân thành công!',
        message: `Booking #${booking.id} (${sportName} - ${facilityName}) đã được gửi, đang chờ xác nhận.`,
        link: '/bookings'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel booking by user (owner of booking)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Sport, as: 'sport' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt' });
    }

    // Verify the booking belongs to the current user (by email)
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy lịch đặt này' });
    }

    // Only allow cancelling pending/pending_payment/confirmed bookings
    const cancellableStatuses = ['pending', 'pending_payment', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({ message: `Không thể hủy lịch đặt có trạng thái "${booking.status}"` });
    }

    await booking.update({ status: 'cancelled' });

    const updatedBooking = await Booking.findByPk(req.params.id, {
      include: [{ model: Sport, as: 'sport' }]
    });

    // Realtime: notify slot released
    emitSlotUpdate(booking.facilityName, booking.date, booking.startTime, booking.endTime, 'cancelled');

    res.json({ message: 'Hủy đặt sân thành công', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking status
router.put('/:id/status', auth, admin, async (req, res) => {
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
      const updatedBookingData = updatedBooking.toJSON();
      sendConfirmedBookingEmail(updatedBookingData)
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

    res.json(updatedBooking);

    // 🔔 Thông báo cho user khi booking thay đổi trạng thái
    try {
      const User = require('../models/User');
      const owner = await User.findOne({ where: { email: booking.customerEmail } });
      if (owner) {
        const sportName = updatedBooking.sport?.nameVi || updatedBooking.sport?.name || '';
        if (status === 'confirmed') {
          await createNotification({
            userId: owner.id,
            type: 'booking_confirmed',
            title: 'Đặt sân đã xác nhận',
            message: `Booking #${booking.id} (${sportName} - ${booking.facilityName}) đã được xác nhận`,
            link: `/bookings`
          });
        } else if (status === 'cancelled') {
          await createNotification({
            userId: owner.id,
            type: 'booking_cancelled',
            title: 'Đặt sân đã bị hủy',
            message: `Booking #${booking.id} (${sportName} - ${booking.facilityName}) đã bị hủy`,
            link: `/bookings`
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
router.delete('/:id', auth, admin, async (req, res) => {
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

module.exports = router;
