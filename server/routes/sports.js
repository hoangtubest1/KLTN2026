const express = require('express');
const router = express.Router();
const Sport = require('../models/Sport');

// Get all sports
router.get('/', async (req, res) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single sport
router.get('/:id', async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
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
    const sport = new Sport(req.body);
    await sport.save();
    res.status(201).json(sport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sport
router.put('/:id', async (req, res) => {
  try {
    const sport = await Sport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found' });
    }
    res.json(sport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sport
router.delete('/:id', async (req, res) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found' });
    }
    res.json({ message: 'Sport deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
