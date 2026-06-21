const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accusedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Noise', 'Cleanliness', 'Smoking', 'Disturbance'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Resolved'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ accusedId: 1 });
complaintSchema.index({ reporterId: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
