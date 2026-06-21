const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getStudentsList,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/students', protect, getStudentsList);

module.exports = router;
