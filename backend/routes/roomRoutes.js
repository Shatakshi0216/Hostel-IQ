const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getSwapRequests,
  createSwapRequest,
  handleSwapRequest,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect); // Require authentication

// Room Swapping Desk endpoints
router.route('/swaps').get(getSwapRequests);
router.route('/swaps/request').post(createSwapRequest);
router.route('/swaps/request/:id').put(handleSwapRequest);

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
