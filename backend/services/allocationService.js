const StudentProfile = require('../models/StudentProfile');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const AllocationRule = require('../models/AllocationRule');

/**
 * Calculates priority score for a student based on active database rules
 */
const calculateStudentScore = (student, rules) => {
  let scoreCGPA = (student.cgpa / 10.0) * 100;
  
  // Regional Contribution (prefer students traveling from further regions)
  // Assume College is in the "North" region
  let scoreRegion = 40;
  if (student.region === 'South') scoreRegion = 100;
  else if (student.region === 'West' || student.region === 'East') scoreRegion = 80;
  
  // Prefer first years and younger students
  let scoreYear = 40;
  if (student.academicYear === 1) scoreYear = 100;
  else if (student.academicYear === 2) scoreYear = 80;
  else if (student.academicYear === 3) scoreYear = 60;
  
  // Special status mapping
  let scoreSpecial = 0;
  if (student.hasDisability) scoreSpecial = 100;
  else if (student.hasScholarship) scoreSpecial = 80;
  else if (student.sportsQuota) scoreSpecial = 60;

  let totalScore = 0;
  
  rules.forEach(rule => {
    if (!rule.isActive) return;
    
    switch (rule.criterionName) {
      case 'CGPA':
        totalScore += scoreCGPA * (rule.weightPercent / 100);
        break;
      case 'RegionalContribution':
        totalScore += scoreRegion * (rule.weightPercent / 100);
        break;
      case 'AcademicYear':
        totalScore += scoreYear * (rule.weightPercent / 100);
        break;
      case 'SpecialCategory':
        totalScore += scoreSpecial * (rule.weightPercent / 100);
        break;
      default:
        break;
    }
  });

  return parseFloat(totalScore.toFixed(2));
};

/**
 * Runs the Hostel Allocation Engine
 */
const runHostelAllocation = async () => {
  // Reset current allocations for a fresh run (Must run BEFORE querying documents into memory)
  await StudentProfile.updateMany({}, { allocatedHostelId: null, allocatedRoomId: null, status: 'Unallocated', waitlistPosition: null });
  await Room.updateMany({}, { currentOccupants: [] });

  // 1. Fetch active rules
  let rules = await AllocationRule.find({ isActive: true });
  if (rules.length === 0) {
    // Seed default rules if not exists
    rules = [
      { criterionName: 'CGPA', weightPercent: 40, isActive: true },
      { criterionName: 'RegionalContribution', weightPercent: 20, isActive: true },
      { criterionName: 'AcademicYear', weightPercent: 30, isActive: true },
      { criterionName: 'SpecialCategory', weightPercent: 10, isActive: true }
    ];
  }

  // 2. Get all students and calculate priority scores
  const allStudents = await StudentProfile.find().populate('userId');
  const students = allStudents.filter(s => s.userId);
  
  for (let student of students) {
    student.priorityScore = calculateStudentScore(student, rules);
    await student.save();
  }

  // 3. Get all hostels and rooms to calculate live capacities
  const hostels = await Hostel.find();
  const rooms = await Room.find();
  
  // Map hostel capacity based on rooms
  const hostelCapacities = {};
  for (let hostel of hostels) {
    const hostelRooms = rooms.filter(r => r.hostelId && r.hostelId.toString() === hostel._id.toString());
    const totalCap = hostelRooms.reduce((sum, r) => sum + r.capacity, 0);
    
    hostelCapacities[hostel._id.toString()] = {
      _id: hostel._id,
      name: hostel.name,
      genderRestriction: hostel.genderRestriction,
      minCgpa: hostel.minCgpa || 0.0,
      allowedCohorts: hostel.allowedCohorts || [],
      totalCapacity: totalCap > 0 ? totalCap : hostel.totalCapacity,
      allocatedCount: 0
    };
  }

  // 4. Sort students by Priority Score descending
  // Tie-breaker: Disability > Scholarship > Sports > Regional contribution
  const sortedStudents = [...students].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (a.hasDisability !== b.hasDisability) return b.hasDisability ? 1 : -1;
    if (a.hasScholarship !== b.hasScholarship) return b.hasScholarship ? 1 : -1;
    if (a.sportsQuota !== b.sportsQuota) return b.sportsQuota ? 1 : -1;
    
    // Sort regions: South (furthest) > East/West > North
    const regionWeight = { South: 3, East: 2, West: 2, North: 1 };
    const aRegionVal = regionWeight[a.region] || 0;
    const bRegionVal = regionWeight[b.region] || 0;
    return bRegionVal - aRegionVal;
  });

  const waitlists = [];
  const allocations = [];

  // 5. Allocate students to Hostels based on capacity and gender
  for (let student of sortedStudents) {
    // Check gender using the student's explicit gender field
    const studentGender = student.gender === 'Female' ? 'Girls' : 'Boys';

    // Find eligible hostel with space
    let allocatedHostel = null;
    for (let hostelId in hostelCapacities) {
      const hostel = hostelCapacities[hostelId];
      const genderMatches = hostel.genderRestriction === 'Co-ed' || hostel.genderRestriction === studentGender;
      const cgpaMatches = student.cgpa >= hostel.minCgpa;
      const yearMatches = hostel.allowedCohorts && hostel.allowedCohorts.includes(student.academicYear);
      
      if (genderMatches && cgpaMatches && yearMatches && hostel.allocatedCount < hostel.totalCapacity) {
        allocatedHostel = hostel;
        break;
      }
    }

    if (allocatedHostel) {
      allocatedHostel.allocatedCount++;
      student.status = 'Allocated';
      student.allocatedHostelId = allocatedHostel._id;
      student.waitlistPosition = null;
      await student.save();
      allocations.push({ studentId: student.userId._id, hostelName: allocatedHostel.name, score: student.priorityScore });
    } else {
      // Place on Waitlist
      waitlists.push(student);
    }
  }

  // Update waitlist numbers in DB
  for (let i = 0; i < waitlists.length; i++) {
    const student = waitlists[i];
    student.status = 'Waitlisted';
    student.waitlistPosition = i + 1;
    await student.save();
  }

  return {
    success: true,
    allocatedCount: allocations.length,
    waitlistCount: waitlists.length,
    allocations,
  };
};

module.exports = {
  calculateStudentScore,
  runHostelAllocation
};
