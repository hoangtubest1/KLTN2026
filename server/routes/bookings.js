const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { sendBookingConfirmationEmail, sendConfirmedBookingEmail } = require('../utils/emailService');

// Get all bookings (with optional user filter)
// Note: This route is public but will filter by user email if token is provided
router.get('/', async (req, res) => {
  try {
    const query = {};
    // If Authorization header exists, try to get user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (user && user.role !== 'admin') {
          query.customerEmail = user.email;
        }
      } catch (err) {
        // Invalid token, continue without filter
      }
    }
    const bookings = await Booking.find(query).populate('sportId').sort({ date: -1, startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings by date
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const bookings = await Booking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('sportId');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('sportId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking
router.post('/', [
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

    const { sportId, facilityName, customerName, customerPhone, customerEmail, date, startTime, endTime, notes } = req.body;

    // Check if sport exists
    const sport = await Sport.findById(sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Môn thể thao không tồn tại' });
    }

    // Check for conflicts
    const existingBooking = await Booking.findOne({
      sportId,
      facilityName,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Khung giờ này đã được đặt' });
    }

    // Calculate duration and price
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    const totalPrice = duration * sport.pricePerHour;

    const booking = new Booking({
      sportId,
      facilityName,
      customerName,
      customerPhone,
      customerEmail,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      totalPrice,
      notes,
      status: 'pending'
    });

    await booking.save();
    const populatedBooking = await Booking.findById(booking._id).populate('sportId');

    // Send confirmation email (don't block if email fails)
    sendBookingConfirmationEmail(populatedBooking)
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
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('sportId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send confirmation email when status is changed to 'confirmed'
    if (status === 'confirmed') {
      sendConfirmedBookingEmail(booking)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Confirmation email sent to ${booking.customerEmail}`);
          } else {
            console.error(`⚠️ Failed to send confirmation email to ${booking.customerEmail}:`, result.error);
          }
        })
        .catch((error) => {
          console.error(`⚠️ Confirmation email sending error for ${booking.customerEmail}:`, error.message);
        });
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
