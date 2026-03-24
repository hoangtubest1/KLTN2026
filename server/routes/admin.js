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
        ['date', 'DESC'],
        ['startTime', 'DESC']
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

module.exports = router;

