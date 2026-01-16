const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const { sendConfirmedBookingEmail } = require('../utils/emailService');

// Get all bookings (Admin only)
router.get('/bookings', auth, admin, async (req, res) => {
  try {
    const { status, date, sportId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (sportId) {
      query.sportId = sportId;
    }

    const bookings = await Booking.find(query)
      .populate('sportId')
      .sort({ date: -1, startTime: -1 })
      .limit(100);

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get booking statistics
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking status
router.put('/bookings/:id/status', auth, admin, async (req, res) => {
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
router.delete('/bookings/:id', auth, admin, async (req, res) => {
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

// Get all sports (for admin)
router.get('/sports', auth, admin, async (req, res) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


