const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect); // Require authentication

router
  .route('/')
  .get(getRooms)
  .post(authorize('SuperAdmin', 'HostelAdmin'), createRoom);

router
  .route('/:id')
  .get(getRoomById)
  .put(authorize('SuperAdmin', 'HostelAdmin'), updateRoom)
  .delete(authorize('SuperAdmin', 'HostelAdmin'), deleteRoom);

module.exports = router;
