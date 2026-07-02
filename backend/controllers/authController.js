const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hosteliq_super_secure_jwt_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Student',
    });

    if (user) {
      // If user is a Student, create a default empty StudentProfile
      if (user.role === 'Student') {
        const isFemale = /priya|neha|sita|rita|female|girl|ananya|pooja|sneha|shatakshi/i.test(user.name);
        await StudentProfile.create({
          userId: user._id,
          cgpa: 7.0, // defaults
          academicYear: 'BTech 1',
          gender: isFemale ? 'Female' : 'Male',
        });
      }

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Fetch student profile status if role is Student
      let profileStatus = null;
      if (user.role === 'Student') {
        const profile = await StudentProfile.findOne({ userId: user._id });
        if (profile) {
          profileStatus = profile.status;
        }
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: profileStatus,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let studentProfile = null;

    if (user.role === 'Student') {
      studentProfile = await StudentProfile.findOne({ userId: user._id })
        .populate('allocatedHostelId')
        .populate('allocatedRoomId')
        .populate('preferredRoommates', 'name email');
    }

    res.json({
      success: true,
      data: {
        user,
        studentProfile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students (for roommate auto-complete search)
// @route   GET /api/auth/students
// @access  Private
const getStudentsList = async (req, res) => {
  try {
    // Return all users who have Student role and are NOT the requesting user
    const query = { role: 'Student' };
    if (req.user) {
      query._id = { $ne: req.user._id };
    }
    
    const students = await User.find(query).select('name email');
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all wardens (SuperAdmin only)
// @route   GET /api/auth/wardens
// @access  Private (SuperAdmin)
const getWardensList = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access warden listings.' });
    }

    const wardens = await User.find({ role: 'HostelAdmin' })
      .populate('managedHostelId', 'name')
      .select('name email phone managedHostelId');

    res.json({ success: true, data: wardens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getStudentsList,
  getWardensList,
};
