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
    allowedCohorts: {
      type: [String],
      default: ['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hostel', hostelSchema);
