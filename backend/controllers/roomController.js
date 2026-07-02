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

const SwapRequest = require('../models/SwapRequest');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// @desc    Get all swap requests involving this student
// @route   GET /api/rooms/swaps
// @access  Private (Student)
const getSwapRequests = async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [
        { requesterId: req.user._id },
        { targetStudentId: req.user._id }
      ]
    })
    .populate('requesterId', 'name email')
    .populate('targetStudentId', 'name email');

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create swap request
// @route   POST /api/rooms/swaps/request
// @access  Private (Student)
const createSwapRequest = async (req, res) => {
  const { targetEmail } = req.body;

  try {
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Please provide target student email' });
    }

    const selfProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!selfProfile || !selfProfile.allocatedRoomId) {
      return res.status(400).json({ success: false, message: 'You must have an allocated room to initiate a swap' });
    }

    const targetUser = await User.findOne({ email: targetEmail.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Classmate with this email was not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot swap rooms with yourself' });
    }

    const targetProfile = await StudentProfile.findOne({ userId: targetUser._id });
    if (!targetProfile || !targetProfile.allocatedRoomId) {
      return res.status(400).json({ success: false, message: 'The selected student must have an allocated room to swap' });
    }

    // Check if target is same gender
    if (selfProfile.gender !== targetProfile.gender) {
      return res.status(400).json({ success: false, message: 'You can only swap rooms with someone of the same gender' });
    }

    // Check if pending request exists
    const existing = await SwapRequest.findOne({
      requesterId: req.user._id,
      targetStudentId: targetUser._id,
      status: 'Pending'
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A pending swap request already exists with this student' });
    }

    const swapRequest = await SwapRequest.create({
      requesterId: req.user._id,
      targetStudentId: targetUser._id,
      status: 'Pending'
    });

    res.status(201).json({ success: true, data: swapRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject swap request
// @route   PUT /api/rooms/swaps/request/:id
// @access  Private (Student)
const handleSwapRequest = async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (swapRequest.targetStudentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to respond to this swap request' });
    }

    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This swap request has already been processed' });
    }

    if (action === 'reject') {
      swapRequest.status = 'Rejected';
      await swapRequest.save();
      return res.json({ success: true, data: swapRequest });
    }

    if (action !== 'approve') {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or reject' });
    }

    // Swap room allocation logic
    const requesterProfile = await StudentProfile.findOne({ userId: swapRequest.requesterId });
    const targetProfile = await StudentProfile.findOne({ userId: swapRequest.targetStudentId });

    if (!requesterProfile || !requesterProfile.allocatedRoomId || !targetProfile || !targetProfile.allocatedRoomId) {
      return res.status(400).json({ success: false, message: 'Both students must have active allocations to perform the swap' });
    }

    const roomA_Id = requesterProfile.allocatedRoomId;
    const roomB_Id = targetProfile.allocatedRoomId;
    const hostelA_Id = requesterProfile.allocatedHostelId;
    const hostelB_Id = targetProfile.allocatedHostelId;

    // Swap fields in profiles
    requesterProfile.allocatedRoomId = roomB_Id;
    requesterProfile.allocatedHostelId = hostelB_Id;
    
    targetProfile.allocatedRoomId = roomA_Id;
    targetProfile.allocatedHostelId = hostelA_Id;

    await requesterProfile.save();
    await targetProfile.save();

    // Update Room occupants lists
    // Room A
    await Room.findByIdAndUpdate(roomA_Id, {
      $pull: { currentOccupants: swapRequest.requesterId },
    });
    await Room.findByIdAndUpdate(roomA_Id, {
      $push: { currentOccupants: swapRequest.targetStudentId },
    });

    // Room B
    await Room.findByIdAndUpdate(roomB_Id, {
      $pull: { currentOccupants: swapRequest.targetStudentId },
    });
    await Room.findByIdAndUpdate(roomB_Id, {
      $push: { currentOccupants: swapRequest.requesterId },
    });

    swapRequest.status = 'Approved';
    await swapRequest.save();

    // Cancel/Reject all other pending swap requests for both students
    await SwapRequest.updateMany(
      {
        _id: { $ne: swapRequest._id },
        $or: [
          { requesterId: swapRequest.requesterId },
          { targetStudentId: swapRequest.requesterId },
          { requesterId: swapRequest.targetStudentId },
          { targetStudentId: swapRequest.targetStudentId }
        ],
        status: 'Pending'
      },
      { status: 'Rejected' }
    );

    res.json({ success: true, message: 'Room swapped successfully', data: swapRequest });
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
  getSwapRequests,
  createSwapRequest,
  handleSwapRequest,
};
