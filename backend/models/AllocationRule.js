const mongoose = require('mongoose');

const allocationRuleSchema = new mongoose.Schema(
  {
    criterionName: {
      type: String,
      required: true,
      unique: true,
      enum: ['CGPA', 'RegionalContribution', 'AcademicYear', 'SpecialCategory'],
    },
    weightPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AllocationRule', allocationRuleSchema);
