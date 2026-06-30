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
    console.error('Hostel Allocation Error:', error);
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
    const isWarden = req.user.role === 'HostelAdmin';
    
    if (isWarden) {
      if (!req.user.managedHostelId) {
        return res.status(403).json({ success: false, message: 'Warden account is not linked to any hostel block.' });
      }
      
      const hostelId = req.user.managedHostelId;
      const hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        return res.status(404).json({ success: false, message: 'Managed hostel not found.' });
      }

      // 1. Scoped KPIs
      const totalStudents = await StudentProfile.countDocuments({ allocatedHostelId: hostelId });
      const rooms = await Room.find({ hostelId });
      
      const totalRooms = rooms.length;
      const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
      const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupants.length, 0);
      const occupancyRate = totalCapacity > 0 ? parseFloat(((totalOccupied / totalCapacity) * 100).toFixed(1)) : 0;
      
      // Find all students allocated to this Warden's hostel
      const hostelStudents = await StudentProfile.find({ allocatedHostelId: hostelId }).populate('userId', 'name email');
      const studentUserIds = hostelStudents.map(p => p.userId._id);

      const resolvedComplaints = await Complaint.countDocuments({
        status: 'Resolved',
        $or: [
          { reporterId: { $in: studentUserIds } },
          { accusedId: { $in: studentUserIds } }
        ]
      });
      const totalComplaints = await Complaint.countDocuments({
        $or: [
          { reporterId: { $in: studentUserIds } },
          { accusedId: { $in: studentUserIds } }
        ]
      });
      const openComplaintsCount = totalComplaints - resolvedComplaints;

      // Calculate Conflict Risk Categories for their students
      let lowRisk = 0, medRisk = 0, highRisk = 0;
      for (let s of hostelStudents) {
        const risk = await getConflictRisk(s.userId._id);
        if (risk.category === 'High Risk') highRisk++;
        else if (risk.category === 'Medium Risk') medRisk++;
        else lowRisk++;
      }

      // 2. Bed Occupancy Distribution
      const allocationDist = [
        { name: 'Occupied Beds', value: totalOccupied },
        { name: 'Empty Beds', value: totalCapacity - totalOccupied },
      ];

      // 3. Student Distribution across academic years in this hostel
      const year1 = await StudentProfile.countDocuments({ allocatedHostelId: hostelId, academicYear: 1 });
      const year2 = await StudentProfile.countDocuments({ allocatedHostelId: hostelId, academicYear: 2 });
      const year3 = await StudentProfile.countDocuments({ allocatedHostelId: hostelId, academicYear: 3 });
      const year4 = await StudentProfile.countDocuments({ allocatedHostelId: hostelId, academicYear: 4 });
      const yearDist = [
        { name: '1st Year', value: year1 },
        { name: '2nd Year', value: year2 },
        { name: '3rd Year', value: year3 },
        { name: '4th Year', value: year4 },
      ];

      const uniqueYears = [...new Set(hostelStudents.map(s => s.academicYear))].sort();
      const residingYearsStr = uniqueYears.length > 0 
        ? uniqueYears.map(y => `${y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year`).join(', ')
        : 'None';

      // 4. Build detailed student table data
      const studentDetailsList = [];
      for (let s of hostelStudents) {
        // Find their room number
        const roomObj = rooms.find(r => r.currentOccupants.some(id => id.toString() === s.userId._id.toString()));
        
        // Find their roommates
        let roommatesStr = 'None';
        if (roomObj) {
          const roommateProfiles = await StudentProfile.find({
            userId: { $in: roomObj.currentOccupants, $ne: s.userId._id }
          }).populate('userId', 'name');
          if (roommateProfiles.length > 0) {
            roommatesStr = roommateProfiles.map(rp => rp.userId.name).join(', ');
          }
        }

        studentDetailsList.push({
          name: s.userId.name,
          email: s.userId.email,
          cgpa: s.cgpa,
          branch: s.branch,
          academicYear: s.academicYear,
          priorityScore: s.priorityScore,
          roomNumber: roomObj ? roomObj.roomNumber : 'Not Assigned',
          roommates: roommatesStr
        });
      }

      // 5. Build detailed visual room layout list
      const roomDetailsList = [];
      for (let r of rooms) {
        const roomOccupants = [];
        if (r.currentOccupants.length > 0) {
          const occupantProfiles = await StudentProfile.find({
            userId: { $in: r.currentOccupants }
          }).populate('userId', 'name email');
          for (let op of occupantProfiles) {
            roomOccupants.push({
              _id: op.userId._id,
              name: op.userId.name,
              email: op.userId.email,
              cgpa: op.cgpa,
              branch: op.branch,
              academicYear: op.academicYear
            });
          }
        }

        let state = 'empty';
        if (r.currentOccupants.length > 0) {
          state = r.currentOccupants.length === r.capacity ? 'full' : 'partial';
        }

        roomDetailsList.push({
          _id: r._id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          capacity: r.capacity,
          occupantsCount: r.currentOccupants.length,
          occupants: roomOccupants,
          state
        });
      }

      return res.json({
        success: true,
        data: {
          isWarden: true,
          hostelName: hostel.name,
          residingYears: residingYearsStr,
          kpis: {
            totalStudents,
            totalHostels: 1, // Scoped
            totalRooms,
            totalCapacity,
            occupancyRate,
            waitlistCount: 0, // Not applicable
            openComplaintsCount,
          },
          charts: {
            hostelOccupancy: [],
            allocationDistribution: allocationDist,
            yearDistribution: yearDist,
            conflictRiskDistribution: [
              { name: 'Low Risk', value: lowRisk },
              { name: 'Medium Risk', value: medRisk },
              { name: 'High Risk', value: highRisk },
            ],
          },
          studentsList: studentDetailsList,
          roomsList: roomDetailsList
        }
      });
    }

    // --- SUPERADMIN / GLOBAL METRICS FLOW ---
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

    // Hostel list with Average CGPA and Min CGPA threshold
    const hostels = await Hostel.find();
    const hostelsList = [];
    for (let hostel of hostels) {
      const hRooms = rooms.filter(r => r.hostelId.toString() === hostel._id.toString());
      const occupied = hRooms.reduce((sum, r) => sum + r.currentOccupants.length, 0);
      
      const hostelStudents = await StudentProfile.find({ allocatedHostelId: hostel._id });
      let avgCgpa = 0.0;
      if (hostelStudents.length > 0) {
        const sumCgpa = hostelStudents.reduce((sum, s) => sum + s.cgpa, 0);
        avgCgpa = parseFloat((sumCgpa / hostelStudents.length).toFixed(2));
      }

      hostelsList.push({
        _id: hostel._id,
        name: hostel.name,
        genderRestriction: hostel.genderRestriction,
        occupiedCount: occupied,
        calculatedCapacity: hRooms.reduce((sum, r) => sum + r.capacity, 0) || hostel.totalCapacity,
        avgCgpa,
        minCgpa: hostel.minCgpa || 0.0
      });
    }

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
        isWarden: false,
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
          hostelOccupancy: [],
          allocationDistribution: allocationDist,
          yearDistribution: yearDist,
          conflictRiskDistribution: [
            { name: 'Low Risk', value: lowRisk },
            { name: 'Medium Risk', value: medRisk },
            { name: 'High Risk', value: highRisk },
          ],
        },
        hostelsList
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
