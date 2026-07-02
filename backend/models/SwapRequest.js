const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
