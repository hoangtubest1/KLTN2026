const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const { body, validationResult } = require('express-validator');
const { auth, admin } = require('../middleware/auth');
const { sendBookingConfirmationEmail, sendConfirmedBookingEmail } = require('../utils/emailService');
const { Op } = require('sequelize'); // Import Sequelize operators

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
          // Only filter by user email if NOT fetching for schedule view
          if (!req.query.date && !req.query.sportId) {
            where.customerEmail = user.email;
          }
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

    const bookings = await Booking.findAll({
      where,
      include: [{
        model: Sport,
        as: 'sport'
      }],
      order: [
        ['date', 'DESC'],
        ['startTime', 'DESC']
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

    const { sportId, facilityName, facilityAddress, facilityPhone, customerName, customerPhone, customerEmail, date, startTime, endTime, notes } = req.body;

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
          [Op.in]: ['pending', 'confirmed']
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
      status: 'pending'
    });

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
    sendBookingConfirmationEmail(bookingData)
      .then((result) => {
        if (result.success) {
          console.log(`✅ Confirmation email sent to ${customerEmail}`);
        } else {
          console.error(`⚠️ Failed to send email to ${customerEmail}:`, result.error);
        }
      })
      .catch((error) => {
        console.error(`⚠️ Email sending error for ${customerEmail}:`, error.message);
      });

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
