const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    block: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
roomSchema.index({ hostelId: 1, block: 1, roomNumber: 1 });

module.exports = mongoose.model('Room', roomSchema);
