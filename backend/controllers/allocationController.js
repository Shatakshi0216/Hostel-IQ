const AllocationRule = require('../models/AllocationRule');
const StudentProfile = require('../models/StudentProfile');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const { runHostelAllocation } = require('../services/allocationService');
const { getConflictRisk } = require('../services/matchingService');

// @desc    Get all active criteria rules
// @route   GET /api/allocation/rules
// @access  Private
const getRules = async (req, res) => {
  try {
    let rules = await AllocationRule.find();
    if (rules.length === 0) {
      // Create default rules if none exist
      rules = await AllocationRule.create([
        { criterionName: 'CGPA', weightPercent: 40, isActive: true },
        { criterionName: 'RegionalContribution', weightPercent: 20, isActive: true },
        { criterionName: 'AcademicYear', weightPercent: 30, isActive: true },
        { criterionName: 'SpecialCategory', weightPercent: 10, isActive: true },
      ]);
    }
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update rule weights
// @route   PUT /api/allocation/rules
// @access  Private (Admins)
const updateRules = async (req, res) => {
  const { rules } = req.body; // Array of rules: [{ criterionName, weightPercent, isActive }]

  try {
    // Skip total weight validation to allow custom weight ratios

    for (let ruleData of rules) {
      await AllocationRule.findOneAndUpdate(
        { criterionName: ruleData.criterionName },
        { weightPercent: ruleData.weightPercent, isActive: ruleData.isActive },
        { new: true, upsert: true }
      );
    }

    const updatedRules = await AllocationRule.find();
    res.json({ success: true, data: updatedRules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Run Hostel Allocation Engine
// @route   POST /api/allocation/run
// @access  Private (Admins)
const triggerAllocation = async (req, res) => {
  try {
    const result = await runHostelAllocation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student rankings
// @route   GET /api/allocation/rankings
// @access  Private (Admins)
const getRankings = async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .populate('userId', 'name email')
      .populate('allocatedHostelId', 'name')
      .sort({ priorityScore: -1 });
    
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & chart data
// @route   GET /api/allocation/metrics
// @access  Private (Admins)
const getMetrics = async (req, res) => {
  try {
    // 1. Core KPIs
    const totalStudents = await StudentProfile.countDocuments();
    const totalHostels = await Hostel.countDocuments();
    const rooms = await Room.find();
    
    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupants.length, 0);
    const occupancyRate = totalCapacity > 0 ? parseFloat(((totalOccupied / totalCapacity) * 100).toFixed(1)) : 0;
    
    const waitlistCount = await StudentProfile.countDocuments({ status: 'Waitlisted' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const totalComplaints = await Complaint.countDocuments();
    const openComplaintsCount = totalComplaints - resolvedComplaints;

    // Calculate Conflict Risk Categories
    const students = await StudentProfile.find();
    let lowRisk = 0, medRisk = 0, highRisk = 0;
    for (let s of students) {
      const risk = await getConflictRisk(s.userId);
      if (risk.category === 'High Risk') highRisk++;
      else if (risk.category === 'Medium Risk') medRisk++;
      else lowRisk++;
    }

    // 2. Hostel Occupancy chart data
    const hostels = await Hostel.find();
    const hostelOccupancyData = hostels.map(hostel => {
      const hRooms = rooms.filter(r => r.hostelId.toString() === hostel._id.toString());
      const cap = hRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occ = hRooms.reduce((sum, r) => sum + r.currentOccupants.length, 0);
      return {
        name: hostel.name,
        capacity: cap > 0 ? cap : hostel.totalCapacity,
        occupied: occ,
      };
    });

    // 3. Allocation Distribution
    const allocated = await StudentProfile.countDocuments({ status: 'Allocated' });
    const waitlisted = await StudentProfile.countDocuments({ status: 'Waitlisted' });
    const unallocated = await StudentProfile.countDocuments({ status: 'Unallocated' });
    const allocationDist = [
      { name: 'Allocated', value: allocated },
      { name: 'Waitlisted', value: waitlisted },
      { name: 'Unallocated', value: unallocated },
    ];

    // 4. Student Distribution across academic years
    const year1 = await StudentProfile.countDocuments({ academicYear: 1 });
    const year2 = await StudentProfile.countDocuments({ academicYear: 2 });
    const year3 = await StudentProfile.countDocuments({ academicYear: 3 });
    const year4 = await StudentProfile.countDocuments({ academicYear: 4 });
    const yearDist = [
      { name: '1st Year', value: year1 },
      { name: '2nd Year', value: year2 },
      { name: '3rd Year', value: year3 },
      { name: '4th Year', value: year4 },
    ];

    res.json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalHostels,
          totalRooms,
          totalCapacity,
          totalOccupied,
          occupancyRate,
          waitlistCount,
          openComplaintsCount,
        },
        charts: {
          hostelOccupancy: hostelOccupancyData,
          allocationDistribution: allocationDist,
          yearDistribution: yearDist,
          conflictRiskDistribution: [
            { name: 'Low Risk', value: lowRisk },
            { name: 'Medium Risk', value: medRisk },
            { name: 'High Risk', value: highRisk },
          ],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRules,
  updateRules,
  triggerAllocation,
  getRankings,
  getMetrics,
};
