const express = require('express');
const router = express.Router();
const {
  getRules,
  updateRules,
  triggerAllocation,
  getRankings,
  getMetrics,
  unallocateAll,
  manualAllocateStudent,
} = require('../controllers/allocationController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/rules', getRules);
router.put('/rules', authorize('SuperAdmin', 'HostelAdmin'), updateRules);
router.post('/run', authorize('SuperAdmin'), triggerAllocation);
router.post('/unallocate', authorize('SuperAdmin'), unallocateAll);
router.put('/student/:id', authorize('SuperAdmin'), manualAllocateStudent);
router.get('/rankings', authorize('SuperAdmin', 'HostelAdmin'), getRankings);
router.get('/metrics', authorize('SuperAdmin', 'HostelAdmin'), getMetrics);

module.exports = router;
