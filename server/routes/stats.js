const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { Op, fn, col, literal } = require('sequelize');
const { auth, admin } = require('../middleware/auth');

// Helper: get date range
const getDateRange = (period, year, month, quarter, week) => {
    const now = new Date();
    let start, end;

    if (period === 'day') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
        end.setDate(end.getDate() + 1);
    } else if (period === 'week') {
        const w = week ? parseInt(week) : null;
        const y = year ? parseInt(year) : now.getFullYear();
        if (w) {
            // ISO week
            const jan1 = new Date(y, 0, 1);
            const days = (w - 1) * 7;
            start = new Date(jan1.setDate(jan1.getDate() + days));
            end = new Date(start);
            end.setDate(end.getDate() + 7);
        } else {
            const day = now.getDay() || 7;
            start = new Date(now);
            start.setDate(now.getDate() - day + 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 7);
        }
    } else if (period === 'month') {
        const m = month ? parseInt(month) - 1 : now.getMonth();
        const y = year ? parseInt(year) : now.getFullYear();
        start = new Date(y, m, 1);
        end = new Date(y, m + 1, 1);
    } else if (period === 'quarter') {
        const q = quarter ? parseInt(quarter) : Math.ceil((now.getMonth() + 1) / 3);
        const y = year ? parseInt(year) : now.getFullYear();
        const startMonth = (q - 1) * 3;
        start = new Date(y, startMonth, 1);
        end = new Date(y, startMonth + 3, 1);
    } else if (period === 'year') {
        const y = year ? parseInt(year) : now.getFullYear();
        start = new Date(y, 0, 1);
        end = new Date(y + 1, 0, 1);
    } else {
        // all time
        start = new Date('2000-01-01');
        end = new Date('2100-01-01');
    }
    return { start, end };
};

// GET /api/stats/overview - summary numbers
router.get('/overview', auth, admin, async (req, res) => {
    try {
        const totalRevenue = await Booking.sum('totalPrice', { where: { status: 'completed' } }) || 0;
        const totalBookings = await Booking.count();
        const completedBookings = await Booking.count({ where: { status: 'completed' } });
        const pendingBookings = await Booking.count({ where: { status: 'pending' } });
        const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });
        const totalFacilities = await Facility.count();
        const totalUsers = await User.count();

        res.json({ totalRevenue, totalBookings, completedBookings, pendingBookings, cancelledBookings, totalFacilities, totalUsers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/stats/revenue-by-period?period=month&year=2025
router.get('/revenue-by-period', auth, admin, async (req, res) => {
    try {
        const { period = 'month', year } = req.query;
        const y = year ? parseInt(year) : new Date().getFullYear();

        let groupFormat, labelFn;

        if (period === 'day') {
            // Last 30 days, group by day
            const start = new Date();
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);

            const rows = await Booking.findAll({
                attributes: [
                    [fn('DATE', col('date')), 'label'],
                    [fn('SUM', col('totalPrice')), 'revenue'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { status: { [Op.in]: ['confirmed', 'completed'] }, date: { [Op.gte]: start } },
                group: [fn('DATE', col('date'))],
                order: [[literal('label'), 'ASC']],
                raw: true,
            });
            return res.json(rows.map(r => ({ label: r.label, revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 })));
        }

        if (period === 'week') {
            // Weeks of a year, group by ISO week
            const rows = await Booking.findAll({
                attributes: [
                    [fn('WEEK', col('date'), 1), 'label'],
                    [fn('SUM', col('totalPrice')), 'revenue'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { status: { [Op.in]: ['confirmed', 'completed'] }, date: { [Op.between]: [`${y}-01-01`, `${y}-12-31`] } },
                group: [fn('WEEK', col('date'), 1)],
                order: [[literal('label'), 'ASC']],
                raw: true,
            });
            return res.json(rows.map(r => ({ label: `Tuần ${r.label}`, revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 })));
        }

        if (period === 'month') {
            const rows = await Booking.findAll({
                attributes: [
                    [fn('MONTH', col('date')), 'label'],
                    [fn('SUM', col('totalPrice')), 'revenue'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { status: { [Op.in]: ['confirmed', 'completed'] }, date: { [Op.between]: [`${y}-01-01`, `${y}-12-31`] } },
                group: [fn('MONTH', col('date'))],
                order: [[literal('label'), 'ASC']],
                raw: true,
            });
            const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
            return res.json(rows.map(r => ({ label: monthNames[parseInt(r.label) - 1] || `Tháng ${r.label}`, revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 })));
        }

        if (period === 'quarter') {
            const rows = await Booking.findAll({
                attributes: [
                    [fn('QUARTER', col('date')), 'label'],
                    [fn('SUM', col('totalPrice')), 'revenue'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { status: { [Op.in]: ['confirmed', 'completed'] }, date: { [Op.between]: [`${y}-01-01`, `${y}-12-31`] } },
                group: [fn('QUARTER', col('date'))],
                order: [[literal('label'), 'ASC']],
                raw: true,
            });
            return res.json(rows.map(r => ({ label: `Quý ${r.label}`, revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 })));
        }

        if (period === 'year') {
            const rows = await Booking.findAll({
                attributes: [
                    [fn('YEAR', col('date')), 'label'],
                    [fn('SUM', col('totalPrice')), 'revenue'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { status: { [Op.in]: ['confirmed', 'completed'] } },
                group: [fn('YEAR', col('date'))],
                order: [[literal('label'), 'ASC']],
                raw: true,
            });
            return res.json(rows.map(r => ({ label: String(r.label), revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 })));
        }

        res.json([]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/stats/revenue-by-facility
router.get('/revenue-by-facility', auth, admin, async (req, res) => {
    try {
        const { year } = req.query;
        const y = year ? parseInt(year) : new Date().getFullYear();
        const where = { status: { [Op.in]: ['confirmed', 'completed'] } };
        if (year) {
            where.date = { [Op.between]: [`${y}-01-01`, `${y}-12-31`] };
        }

        const rows = await Booking.findAll({
            attributes: [
                'facilityName',
                [fn('SUM', col('totalPrice')), 'revenue'],
                [fn('COUNT', col('id')), 'count'],
            ],
            where,
            group: ['facilityName'],
            order: [[literal('revenue'), 'DESC']],
            limit: 10,
            raw: true,
        });

        res.json(rows.map(r => ({
            name: r.facilityName,
            revenue: parseFloat(r.revenue) || 0,
            count: parseInt(r.count) || 0,
        })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/stats/top-customers
router.get('/top-customers', auth, admin, async (req, res) => {
    try {
        const { year } = req.query;
        const where = { status: { [Op.in]: ['confirmed', 'completed'] } };
        if (year) {
            const y = parseInt(year);
            where.date = { [Op.between]: [`${y}-01-01`, `${y}-12-31`] };
        }

        const rows = await Booking.findAll({
            attributes: [
                'customerName',
                'customerEmail',
                [fn('SUM', col('totalPrice')), 'totalSpent'],
                [fn('COUNT', col('id')), 'bookingCount'],
            ],
            where,
            group: ['customerEmail', 'customerName'],
            order: [[literal('totalSpent'), 'DESC']],
            limit: 10,
            raw: true,
        });

        res.json(rows.map(r => ({
            name: r.customerName,
            email: r.customerEmail,
            totalSpent: parseFloat(r.totalSpent) || 0,
            bookingCount: parseInt(r.bookingCount) || 0,
        })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/stats/booking-status
router.get('/booking-status', auth, admin, async (req, res) => {
    try {
        const rows = await Booking.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        });
        const map = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
        res.json(rows.map(r => ({ name: map[r.status] || r.status, value: parseInt(r.count) || 0, status: r.status })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
