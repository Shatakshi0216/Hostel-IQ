const express = require('express');
const router = express.Router();
const {
  updateCompatibilityProfile,
  updatePreferences,
  getRoommateOptions,
  getStudentAllocationDetails,
  runMatchingEngine,
} = require('../controllers/matchingController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.put('/profile', updateCompatibilityProfile);
router.put('/preferences', updatePreferences);
router.get('/options', getRoommateOptions);
router.get('/details', getStudentAllocationDetails);
router.post('/run', authorize('SuperAdmin'), runMatchingEngine);

module.exports = router;
