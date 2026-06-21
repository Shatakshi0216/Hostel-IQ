const Complaint = require('../models/Complaint');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get all complaints (Wardens restricted to their hostel block)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    let query = {};

    // If user is Student, only show complaints they reported or are accused in
    if (req.user.role === 'Student') {
      query = {
        $or: [{ reporterId: req.user._id }, { accusedId: req.user._id }],
      };
    }

    // If user is Warden (HostelAdmin), restrict to complaints within their managed hostel
    if (req.user.role === 'HostelAdmin') {
      if (!req.user.managedHostelId) {
        return res.status(403).json({ success: false, message: 'Warden account is not linked to any hostel block.' });
      }

      // Find all students allocated to this Warden's hostel
      const studentsInHostel = await StudentProfile.find({
        allocatedHostelId: req.user.managedHostelId
      });
      const studentUserIds = studentsInHostel.map(p => p.userId);

      query = {
        $or: [
          { reporterId: { $in: studentUserIds } },
          { accusedId: { $in: studentUserIds } }
        ]
      };
    }

    const complaints = await Complaint.find(query)
      .populate('reporterId', 'name email')
      .populate('accusedId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res) => {
  const { accusedEmail, type, severity, description } = req.body;

  try {
    // Look up accused user by email
    const accusedUser = await User.findOne({ email: accusedEmail, role: 'Student' });
    if (!accusedUser) {
      return res.status(404).json({ success: false, message: 'Accused student email not found' });
    }

    if (accusedUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot file a complaint against yourself' });
    }

    const complaint = await Complaint.create({
      reporterId: req.user._id,
      accusedId: accusedUser._id,
      type,
      severity,
      description,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve an active complaint (Warden or SuperAdmin)
// @route   PUT /api/complaints/:id/resolve
// @access  Private (Admins)
const resolveComplaint = async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Warden specific check
    if (req.user.role === 'HostelAdmin') {
      const accusedProfile = await StudentProfile.findOne({ userId: complaint.accusedId });
      if (!accusedProfile || accusedProfile.allocatedHostelId?.toString() !== req.user.managedHostelId.toString()) {
        return res.status(403).json({ success: false, message: 'Wardens can only resolve complaints concerning students in their own hostel.' });
      }
    }

    complaint.status = 'Resolved';
    await complaint.save();

    res.json({ success: true, message: 'Complaint marked as Resolved', data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getComplaints,
  createComplaint,
  resolveComplaint,
};
