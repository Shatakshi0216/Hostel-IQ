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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hostel', hostelSchema);
