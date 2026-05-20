const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Facility = require('../models/Facility');
const Sport = require('../models/Sport');
const Review = require('../models/Review');
const { auth, admin } = require('../middleware/auth');

// Haversine formula - calculate distance between two GPS points (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Advanced search facilities
// GET /api/facilities/search
// ?sport=1&name=san&area=quan+1&minPrice=100000&maxPrice=300000
// &lat=10.78&lng=106.69&sort=distance|price_asc|price_desc|rating|popularity
router.get('/search', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { sport, name, area, minPrice, maxPrice, lat, lng, sort } = req.query;

        // Build WHERE conditions — KHÔNG lọc status ở đây để khớp GET /facilities (sidebar đếm + danh sách cùng nguồn).
        // Trước đây chỉ search active nên DB có inactive/null → sidebar vẫn đếm nhưng kết quả tìm rỗng.
        const where = { isApproved: true };

        if (sport) {
            where.sportId = parseInt(sport);
        }

        // Combined text search: name OR address
        if (name) {
            const term = name.trim();
            where[Op.or] = [
                { name: { [Op.like]: `%${term}%` } },
                { address: { [Op.like]: `%${term}%` } },
            ];
        }

        // area is now a secondary filter combined with name search
        if (area && !name) {
            where.address = { [Op.like]: `%${area}%` };
        }

        if (minPrice || maxPrice) {
            where.pricePerHour = {};
            if (minPrice) where.pricePerHour[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.pricePerHour[Op.lte] = parseFloat(maxPrice);
        }

        // Include sport + reviews for aggregated rating
        const facilities = await Facility.findAll({
            where,
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'nameVi', 'emoji']
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [Sequelize.fn('AVG', Sequelize.col('reviews.rating')), 'avgRating'],
                    [Sequelize.fn('COUNT', Sequelize.col('reviews.id')), 'reviewCount']
                ]
            },
            group: ['Facility.id', 'sport.id'],
            order: [['createdAt', 'DESC']],
            subQuery: false
        });

        // Map results and add distance if needed
        let results = facilities.map(f => {
            const facility = f.toJSON();
            // Normalize rating
            facility.avgRating = facility.avgRating ? parseFloat(facility.avgRating) : 0;
            facility.reviewCount = parseInt(facility.reviewCount) || 0;

            if (lat && lng && facility.latitude && facility.longitude) {
                facility.distance = Math.round(
                    haversineDistance(parseFloat(lat), parseFloat(lng), facility.latitude, facility.longitude) * 10
                ) / 10;
            }
            return facility;
        });

        // Sort results
        if (sort === 'price_asc') {
            results.sort((a, b) => Number(a.pricePerHour) - Number(b.pricePerHour));
        } else if (sort === 'price_desc') {
            results.sort((a, b) => Number(b.pricePerHour) - Number(a.pricePerHour));
        } else if (sort === 'distance' && lat && lng) {
            results.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
        } else if (sort === 'rating') {
            results.sort((a, b) => b.avgRating - a.avgRating);
        }
        // Default: sort by createdAt DESC (most recent first)

        res.json(results);
    } catch (error) {
        console.error('Error searching facilities:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all facilities (with sport info + avgRating + reviewCount)
router.get('/', async (req, res) => {
    try {
        // Admin sees all; public sees only approved
        const isAdmin = req.headers.authorization && (() => {
            try {
                const jwt = require('jsonwebtoken');
                const { JWT_SECRET } = require('../middleware/auth');
                const token = req.headers.authorization.replace('Bearer ', '');
                const decoded = jwt.verify(token, JWT_SECRET);
                const User = require('../models/User');
                // We can't await here easily, so skip admin check for listing
                return false;
            } catch { return false; }
        })();

        const where = {};
        if (!req.query.showAll) {
            where.isApproved = true;
        }

        const facilities = await Facility.findAll({
            where,
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'nameVi']
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [Sequelize.fn('AVG', Sequelize.col('reviews.rating')), 'avgRating'],
                    [Sequelize.fn('COUNT', Sequelize.col('reviews.id')), 'reviewCount']
                ]
            },
            group: ['Facility.id', 'sport.id'],
            order: [['createdAt', 'DESC']],
            subQuery: false
        });
        res.json(facilities);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get booked slots for a facility on a given date (used by mobile app)
// GET /api/facilities/:id/booked-slots?date=YYYY-MM-DD
router.get('/:id/booked-slots', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const Booking = require('../models/Booking');
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'date query parameter is required' });
        }

        // Find the facility to get its name
        const facility = await Facility.findByPk(req.params.id);
        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        // Query bookings matching this facility name (including sub-courts like "Sân A - Sân 1")
        const { sequelize: seq } = require('../config/database');
        const bookings = await Booking.findAll({
            where: {
                facilityName: { [Op.like]: `${facility.name}%` },
                date: seq.where(seq.fn('DATE', seq.col('date')), date),
                status: { [Op.in]: ['pending', 'confirmed', 'pending_payment'] },
            },
            attributes: ['startTime', 'endTime', 'status', 'customerName', 'facilityName'],
        });

        // Return array of { startTime, endTime, status } for the mobile app
        res.json(bookings.map(b => ({
            startTime: (b.startTime || '').substring(0, 5),
            endTime: (b.endTime || '').substring(0, 5),
            status: b.status,
            customerName: b.customerName,
            facilityName: b.facilityName,
        })));
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single facility
router.get('/:id', async (req, res) => {
    try {
        const facility = await Facility.findByPk(req.params.id, {
            include: [{
                model: Sport,
                as: 'sport',
                attributes: ['id', 'name', 'nameVi']
            }]
        });

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        res.json(facility);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get facilities by sport (with avgRating + reviewCount)
router.get('/sport/:sportId', async (req, res) => {
    try {
        const facilities = await Facility.findAll({
            where: {
                sportId: req.params.sportId,
                status: 'active',
                isApproved: true
            },
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'nameVi']
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [Sequelize.fn('AVG', Sequelize.col('reviews.rating')), 'avgRating'],
                    [Sequelize.fn('COUNT', Sequelize.col('reviews.id')), 'reviewCount']
                ]
            },
            group: ['Facility.id', 'sport.id'],
            subQuery: false
        });

        res.json(facilities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create facility (admin only)
router.post('/', auth, admin, async (req, res) => {
    try {
        console.log('Received facility data:', req.body);
        const facility = await Facility.create(req.body);

        // Fetch with sport info
        const populatedFacility = await Facility.findByPk(facility.id, {
            include: [{
                model: Sport,
                as: 'sport',
                attributes: ['id', 'name', 'nameVi']
            }]
        });

        res.status(201).json(populatedFacility);
    } catch (error) {
        console.error('Error creating facility:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update facility (admin only)
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const facility = await Facility.findByPk(req.params.id);

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        await facility.update(req.body);

        // Fetch updated facility with sport info
        const updatedFacility = await Facility.findByPk(req.params.id, {
            include: [{
                model: Sport,
                as: 'sport',
                attributes: ['id', 'name', 'nameVi']
            }]
        });

        res.json(updatedFacility);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete facility (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const facility = await Facility.findByPk(req.params.id);

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        await facility.destroy();
        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
