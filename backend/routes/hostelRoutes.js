const express = require('express');
const router = express.Router();
const {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
} = require('../controllers/hostelController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect); // Require auth for all hostel routes

router
  .route('/')
  .get(authorize('SuperAdmin', 'HostelAdmin'), getHostels)
  .post(authorize('SuperAdmin', 'HostelAdmin'), createHostel);

router
  .route('/:id')
  .get(authorize('SuperAdmin', 'HostelAdmin'), getHostelById)
  .put(authorize('SuperAdmin', 'HostelAdmin'), updateHostel)
  .delete(authorize('SuperAdmin', 'HostelAdmin'), deleteHostel);

module.exports = router;
