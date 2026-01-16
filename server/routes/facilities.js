const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');

// Get all facilities
router.get('/', async (req, res) => {
    try {
        const facilities = await Facility.find()
            .populate('sportId', 'name nameVi emoji')
            .sort({ createdAt: -1 });
        res.json(facilities);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single facility
router.get('/:id', async (req, res) => {
    try {
        const facility = await Facility.findById(req.params.id)
            .populate('sportId', 'name nameVi emoji');

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        res.json(facility);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get facilities by sport
router.get('/sport/:sportId', async (req, res) => {
    try {
        const facilities = await Facility.find({
            sportId: req.params.sportId,
            status: 'active'
        }).populate('sportId', 'name nameVi emoji');

        res.json(facilities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create facility (admin only)
router.post('/', async (req, res) => {
    try {
        console.log('Received facility data:', req.body);
        const facility = new Facility(req.body);
        await facility.save();

        const populatedFacility = await Facility.findById(facility._id)
            .populate('sportId', 'name nameVi emoji');

        res.status(201).json(populatedFacility);
    } catch (error) {
        console.error('Error creating facility:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update facility (admin only)
router.put('/:id', async (req, res) => {
    try {
        const facility = await Facility.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('sportId', 'name nameVi emoji');

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        res.json(facility);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete facility (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const facility = await Facility.findByIdAndDelete(req.params.id);

        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
