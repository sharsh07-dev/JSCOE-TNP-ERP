const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, updateUser, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.put('/users/:uid', authenticate, authorize('admin'), updateUser);

module.exports = router;
