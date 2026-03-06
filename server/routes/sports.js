const express = require('express');
const router = express.Router();
const Sport = require('../models/Sport');
const Facility = require('../models/Facility');

// Get all sports (with facilities)
router.get('/', async (req, res) => {
  try {
    const sports = await Sport.findAll({
      include: [{
        model: Facility,
        as: 'facilities',
        required: false // LEFT JOIN (show sports even without facilities)
      }]
    });
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single sport (with facilities)
router.get('/:id', async (req, res) => {
  try {
    const sport = await Sport.findByPk(req.params.id, {
      include: [{
        model: Facility,
        as: 'facilities'
      }]
    });
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found' });
    }
    res.json(sport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sport (admin)
router.post('/', async (req, res) => {
  try {
    const sport = await Sport.create(req.body);
    res.status(201).json(sport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sport
router.put('/:id', async (req, res) => {
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found' });
    }

    await sport.update(req.body);
    res.json(sport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sport
router.delete('/:id', async (req, res) => {
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found' });
    }

    await sport.destroy();
    res.json({ message: 'Sport deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
