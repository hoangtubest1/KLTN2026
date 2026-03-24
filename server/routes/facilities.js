const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Facility = require('../models/Facility');
const Sport = require('../models/Sport');
const Review = require('../models/Review');

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
// GET /api/facilities/search?sport=1&name=sân&area=quận 1&minPrice=100000&maxPrice=300000&lat=10.78&lng=106.69&sort=distance
router.get('/search', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { sport, name, area, minPrice, maxPrice, lat, lng, sort } = req.query;

        // Build WHERE conditions
        const where = {};

        if (sport) {
            where.sportId = parseInt(sport);
        }

        if (name) {
            where.name = { [Op.like]: `%${name}%` };
        }

        if (area) {
            where.address = { [Op.like]: `%${area}%` };
        }

        if (minPrice || maxPrice) {
            where.pricePerHour = {};
            if (minPrice) where.pricePerHour[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.pricePerHour[Op.lte] = parseFloat(maxPrice);
        }

        const facilities = await Facility.findAll({
            where,
            include: [{
                model: Sport,
                as: 'sport',
                attributes: ['id', 'name', 'nameVi']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Add distance if user provided coordinates
        let results = facilities.map(f => {
            const facility = f.toJSON();
            if (lat && lng && facility.latitude && facility.longitude) {
                facility.distance = Math.round(
                    haversineDistance(parseFloat(lat), parseFloat(lng), facility.latitude, facility.longitude) * 10
                ) / 10; // Round to 1 decimal
            }
            return facility;
        });

        // Sort results
        if (sort === 'price_asc') {
            results.sort((a, b) => a.pricePerHour - b.pricePerHour);
        } else if (sort === 'price_desc') {
            results.sort((a, b) => b.pricePerHour - a.pricePerHour);
        } else if (sort === 'distance' && lat && lng) {
            results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        } else if (sort === 'name') {
            results.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        }

        res.json(results);
    } catch (error) {
        console.error('Error searching facilities:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all facilities (with sport info + avgRating + reviewCount)
router.get('/', async (req, res) => {
    try {
        const facilities = await Facility.findAll({
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
                status: { [Op.in]: ['pending', 'confirmed'] },
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
                status: 'active'
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
