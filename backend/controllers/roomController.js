const Room = require('../models/Room');
const Hostel = require('../models/Hostel');

// @desc    Get all rooms (can filter by hostelId; Wardens forced to their managed hostel)
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  let { hostelId } = req.query;
  const filter = {};

  // Enforce Warden scoping limit
  if (req.user.role === 'HostelAdmin') {
    if (!req.user.managedHostelId) {
      return res.status(403).json({ success: false, message: 'Warden account is not linked to any hostel block.' });
    }
    hostelId = req.user.managedHostelId.toString();
  }

  if (hostelId) {
    filter.hostelId = hostelId;
  }

  try {
    const rooms = await Room.find(filter)
      .populate('hostelId', 'name')
      .populate({
        path: 'currentOccupants',
        select: 'name email',
      });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('hostelId', 'name')
      .populate('currentOccupants', 'name email');
      
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin' && room.hostelId._id.toString() !== req.user.managedHostelId.toString()) {
      return res.status(403).json({ success: false, message: 'Wardens can only access rooms within their assigned hostel.' });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private (Admins)
const createRoom = async (req, res) => {
  const { hostelId, block, floor, roomNumber, capacity } = req.body;

  try {
    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin' && hostelId !== req.user.managedHostelId.toString()) {
      return res.status(403).json({ success: false, message: 'Wardens can only register rooms within their assigned hostel.' });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check if room number already exists in block in this hostel
    const roomExists = await Room.findOne({ hostelId, block, roomNumber });
    if (roomExists) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber} in Block ${block} already exists for this hostel`,
      });
    }

    const room = await Room.create({
      hostelId,
      block,
      floor,
      roomNumber,
      capacity,
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private (Admins)
const updateRoom = async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin' && room.hostelId.toString() !== req.user.managedHostelId.toString()) {
      return res.status(403).json({ success: false, message: 'Wardens are only authorized to edit rooms within their assigned hostel.' });
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (Admins)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Enforce Warden scoping limit
    if (req.user.role === 'HostelAdmin' && room.hostelId.toString() !== req.user.managedHostelId.toString()) {
      return res.status(403).json({ success: false, message: 'Wardens can only delete rooms belonging to their managed hostel.' });
    }

    // Check if room is occupied
    if (room.currentOccupants && room.currentOccupants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete occupied room. De-allocate occupants first.',
      });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
