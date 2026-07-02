const mongoose = require('mongoose');

const roommateProfileSchema = new mongoose.Schema({
  sleepSchedule: {
    type: String,
    enum: ['early_bird', 'night_owl', 'flexible'],
    default: 'flexible'
  },
  wakeTime: {
    type: String,
    enum: ['early', 'moderate', 'late'], // early: <7am, moderate: 7-9am, late: >9am
    default: 'moderate'
  },
  cleanlinessRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  studyHabit: {
    type: String,
    enum: ['quiet', 'group', 'flexible'],
    default: 'flexible'
  },
  introvertExtrovertScale: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },

  gamingHabit: {
    type: String,
    enum: ['none', 'casual', 'heavy'],
    default: 'none'
  },
  musicPreference: {
    type: String,
    enum: ['headphones', 'speakers', 'none'],
    default: 'headphones'
  },
  sportsInterests: [String],
  languagesSpoken: [String],
  personalityTags: [String]
}, { _id: false });

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    batch: {
      type: String,
      required: true,
      default: '2024'
    },
    branch: {
      type: String,
      required: true,
      default: 'CSE'
    },
    region: {
      type: String,
      required: true,
      default: 'North'
    },
    floorPreference: {
      type: String,
      enum: ['Ground Floor', 'First Floor', 'Second Floor', 'No Preference'],
      default: 'No Preference'
    },
    academicYear: {
      type: String,
      enum: ['BTech 1', 'BTech 2', 'BTech 3', 'BTech 4', 'MTech', 'MCA', 'PhD'],
      required: true,
      default: 'BTech 1'
    },
    category: {
      type: String,
      enum: ['General', 'SC_ST', 'OBC', 'EWS'],
      default: 'General'
    },
    hasDisability: {
      type: Boolean,
      default: false
    },
    hasScholarship: {
      type: Boolean,
      default: false
    },
    sportsQuota: {
      type: Boolean,
      default: false
    },
    roommateCompatibilityProfile: {
      type: roommateProfileSchema,
      default: () => ({})
    },
    preferredRoommates: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      validate: [
        val => val.length <= 5,
        'You can select at most 5 preferred roommates'
      ]
    },
    allocatedHostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      default: null
    },
    allocatedRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null
    },
    priorityScore: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Unallocated', 'Allocated', 'Waitlisted'],
      default: 'Unallocated'
    },
    waitlistPosition: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
studentProfileSchema.index({ priorityScore: -1 });
studentProfileSchema.index({ status: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
