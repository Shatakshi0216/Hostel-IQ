const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Room = require('../models/Room');
const { runRoommateAllocation, calculateCompatibilityScore, getConflictRisk } = require('../services/matchingService');

// @desc    Update student roommate compatibility quiz profile
// @route   PUT /api/matching/profile
// @access  Private (Student)
const updateCompatibilityProfile = async (req, res) => {
  const {
    cgpa,
    batch,
    branch,
    region,
    floorPreference,
    academicYear,
    category,
    hasDisability,
    hasScholarship,
    sportsQuota,
    gender,
    sleepSchedule,
    wakeTime,
    cleanlinessRating,
    studyHabit,
    introvertExtrovertScale,
    gamingHabit,
    musicPreference,
    sportsInterests,
    languagesSpoken,
    personalityTags,
  } = req.body;

  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new StudentProfile({ userId: req.user._id });
    }

    // Update academic and institutional metadata
    if (cgpa !== undefined) profile.cgpa = cgpa;
    if (batch !== undefined) profile.batch = batch;
    if (branch !== undefined) profile.branch = branch;
    if (region !== undefined) profile.region = region;
    if (floorPreference !== undefined) profile.floorPreference = floorPreference;
    if (academicYear !== undefined) profile.academicYear = academicYear;
    if (category !== undefined) profile.category = category;
    if (hasDisability !== undefined) profile.hasDisability = hasDisability;
    if (hasScholarship !== undefined) profile.hasScholarship = hasScholarship;
    if (sportsQuota !== undefined) profile.sportsQuota = sportsQuota;
    if (gender !== undefined) profile.gender = gender;

    // Update compatibility profile sub-document (no smokingPreference)
    profile.roommateCompatibilityProfile = {
      sleepSchedule: sleepSchedule || profile.roommateCompatibilityProfile.sleepSchedule,
      wakeTime: wakeTime || profile.roommateCompatibilityProfile.wakeTime,
      cleanlinessRating: cleanlinessRating !== undefined ? cleanlinessRating : profile.roommateCompatibilityProfile.cleanlinessRating,
      studyHabit: studyHabit || profile.roommateCompatibilityProfile.studyHabit,
      introvertExtrovertScale: introvertExtrovertScale !== undefined ? introvertExtrovertScale : profile.roommateCompatibilityProfile.introvertExtrovertScale,
      gamingHabit: gamingHabit || profile.roommateCompatibilityProfile.gamingHabit,
      musicPreference: musicPreference || profile.roommateCompatibilityProfile.musicPreference,
      sportsInterests: sportsInterests || profile.roommateCompatibilityProfile.sportsInterests,
      languagesSpoken: languagesSpoken || profile.roommateCompatibilityProfile.languagesSpoken,
      personalityTags: personalityTags || profile.roommateCompatibilityProfile.personalityTags,
    };

    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update preferred roommate choice (Max 5)
// @route   PUT /api/matching/preferences
// @access  Private (Student)
const updatePreferences = async (req, res) => {
  const { preferredRoommates } = req.body; // Array of up to 5 User IDs

  try {
    if (!Array.isArray(preferredRoommates) || preferredRoommates.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Preferred roommates must be an array of at most 5 user IDs',
      });
    }

    // Verify all selected users are valid students
    const validStudentsCount = await User.countDocuments({
      _id: { $in: preferredRoommates },
      role: 'Student',
    });

    if (validStudentsCount !== preferredRoommates.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more of the selected roommates is invalid',
      });
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    profile.preferredRoommates = preferredRoommates;
    await profile.save();

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get options for roommates search (same hostel & gender, if allocated)
// @route   GET /api/matching/options
// @access  Private (Student)
const getRoommateOptions = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    let profileFilter = { userId: { $ne: req.user._id } };

    // If student is allocated to a hostel, restrict roommate preferences to students allocated to the SAME hostel
    if (student.allocatedHostelId) {
      profileFilter.allocatedHostelId = student.allocatedHostelId;
    }

    const profiles = await StudentProfile.find(profileFilter).populate('userId', 'name email');
    
    const populatedOptions = [];
    for (let p of profiles) {
      if (p.userId) {
        populatedOptions.push({
          _id: p.userId._id,
          name: p.userId.name,
          email: p.userId.email,
          cgpa: p.cgpa,
          batch: p.batch,
          branch: p.branch,
          region: p.region,
          floorPreference: p.floorPreference
        });
      }
    }

    res.json({ success: true, data: populatedOptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's live room allocation and roommate details (with eligibility checks)
// @route   GET /api/matching/details
// @access  Private (Student)
const getStudentAllocationDetails = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('allocatedHostelId')
      .populate('allocatedRoomId')
      .populate('preferredRoommates', 'name email');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    let roomOccupants = [];
    let roommatesData = [];
    let conflict = await getConflictRisk(req.user._id);

    // Calculate eligibility warning warnings for preferred roommates
    const selfCgpa = profile.cgpa;
    const evaluatedPreferences = [];
    for (let pref of profile.preferredRoommates) {
      const pProfile = await StudentProfile.findOne({ userId: pref._id });
      let warning = null;
      if (pProfile) {
        const diff = Math.abs(selfCgpa - pProfile.cgpa);
        if (diff >= 2.0) {
          warning = `High merit difference (Your CGPA: ${selfCgpa.toFixed(2)} vs theirs: ${pProfile.cgpa.toFixed(2)}). They might not qualify for the same hostel block.`;
        }
      }
      evaluatedPreferences.push({
        _id: pref._id,
        name: pref.name,
        email: pref.email,
        cgpa: pProfile ? pProfile.cgpa : null,
        eligibilityWarning: warning
      });
    }

    // Get roommates in the same room
    if (profile.allocatedRoomId) {
      const room = await Room.findById(profile.allocatedRoomId).populate('currentOccupants', 'name email');
      if (room) {
        roomOccupants = room.currentOccupants.filter(
          occ => occ._id.toString() !== req.user._id.toString()
        );

        // Calculate compatibility score with each roommate
        for (let occupant of roomOccupants) {
          const occProfile = await StudentProfile.findOne({ userId: occupant._id });
          const compScore = occProfile
            ? calculateCompatibilityScore(profile.roommateCompatibilityProfile, occProfile.roommateCompatibilityProfile)
            : 50;

          // Check if roommate preference is mutual
          const preA = profile.preferredRoommates || [];
          const preB = occProfile ? occProfile.preferredRoommates || [] : [];
          
          const userPrefersOcc = preA.map(id => id._id.toString()).includes(occupant._id.toString());
          const occPrefersUser = preB.map(id => id.toString()).includes(req.user._id.toString());

          let prefStatus = 'No Preference';
          if (userPrefersOcc && occPrefersUser) prefStatus = 'Mutual Match';
          else if (userPrefersOcc) prefStatus = 'Preferred';
          else if (occPrefersUser) prefStatus = 'Preferred by Roommate';

          roommatesData.push({
            _id: occupant._id,
            name: occupant.name,
            email: occupant.email,
            compatibilityScore: compScore,
            preferenceStatus: prefStatus,
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        profile: {
          ...profile.toObject(),
          preferredRoommates: evaluatedPreferences
        },
        conflictRisk: conflict,
        roommates: roommatesData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Run roommate and room matching engine
// @route   POST /api/matching/run
// @access  Private (Admins)
const runMatchingEngine = async (req, res) => {
  try {
    const result = await runRoommateAllocation();
    res.json(result);
  } catch (error) {
    console.error('Roommate Matching Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateCompatibilityProfile,
  updatePreferences,
  getRoommateOptions,
  getStudentAllocationDetails,
  runMatchingEngine,
};
