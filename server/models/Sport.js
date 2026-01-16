const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  nameVi: {
    type: String,
    required: true
  },
  description: String,
  pricePerHour: {
    type: Number,
    required: true,
    default: 0
  },
  image: String,
  facilities: [{
    name: String,
    capacity: Number,
    available: {
      type: Boolean,
      default: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sport', sportSchema);
