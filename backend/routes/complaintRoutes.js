const express = require('express');
const router = express.Router();
const {
  getComplaints,
  createComplaint,
  resolveComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getComplaints)
  .post(createComplaint);

router.put('/:id/resolve', authorize('SuperAdmin', 'HostelAdmin'), resolveComplaint);

module.exports = router;
