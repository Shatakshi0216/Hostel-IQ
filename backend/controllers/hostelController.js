const Hostel = require('../models/Hostel');
const Room = require('../models/Room');

// @desc    Get all hostels (Wardens restricted to their managed hostel)
// @route   GET /api/hostels
// @access  Private
const getHostels = async (req, res) => {
  try {
    let query = {};
    
    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin') {
      if (!req.user.managedHostelId) {
        return res.status(403).json({ success: false, message: 'Warden account is not linked to any hostel block.' });
      }
      query = { _id: req.user.managedHostelId };
    }

    const hostels = await Hostel.find(query);
    
    // Inject calculated capacity (sum of room capacities) dynamically
    const rooms = await Room.find();
    const hostelsWithCap = hostels.map(hostel => {
      const hRooms = rooms.filter(r => r.hostelId.toString() === hostel._id.toString());
      const realCap = hRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occupied = hRooms.reduce((sum, r) => sum + r.currentOccupants.length, 0);
      
      return {
        ...hostel.toObject(),
        calculatedCapacity: realCap > 0 ? realCap : hostel.totalCapacity,
        occupiedCount: occupied,
      };
    });

    res.json({ success: true, data: hostelsWithCap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single hostel
// @route   GET /api/hostels/:id
// @access  Private
const getHostelById = async (req, res) => {
  try {
    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin' && req.user.managedHostelId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Wardens can only access details of their associated hostel.' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    res.json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a hostel
// @route   POST /api/hostels
// @access  Private (Council of Wardens / SuperAdmin only)
const createHostel = async (req, res) => {
  const { name, genderRestriction, totalCapacity } = req.body;

  try {
    // Only SuperAdmin can create hostels
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Only the global Council of Wardens can register new hostel buildings.' });
    }

    const hostelExists = await Hostel.findOne({ name });
    if (hostelExists) {
      return res.status(400).json({ success: false, message: 'Hostel with this name already exists' });
    }

    const hostel = await Hostel.create({
      name,
      genderRestriction,
      totalCapacity,
    });

    res.status(201).json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a hostel
// @route   PUT /api/hostels/:id
// @access  Private (SuperAdmin or associated Warden)
const updateHostel = async (req, res) => {
  try {
    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin') {
      if (req.body.minCgpa !== undefined) {
        return res.status(403).json({ success: false, message: 'Wardens are not authorized to alter the CGPA threshold requirements.' });
      }
      if (req.user.managedHostelId.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Wardens can only update settings for their associated hostel.' });
      }
    }

    let hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a hostel
// @route   DELETE /api/hostels/:id
// @access  Private (Council of Wardens / SuperAdmin only)
const deleteHostel = async (req, res) => {
  try {
    // Only SuperAdmin can delete hostels
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Only the Council of Wardens is authorized to delete hostel buildings.' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check if rooms are linked
    const roomsCount = await Room.countDocuments({ hostelId: req.params.id });
    if (roomsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete hostel that contains rooms. Delete the rooms first.',
      });
    }

    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hostel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
};
