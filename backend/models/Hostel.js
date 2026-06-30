const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a hostel name'],
      unique: true,
      trim: true,
    },
    genderRestriction: {
      type: String,
      enum: ['Boys', 'Girls', 'Co-ed'],
      required: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    minCgpa: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 10.0,
    },
    allowedYear: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hostel', hostelSchema);
