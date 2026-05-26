const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authCtrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, try again after 15 minutes' }
});

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authCtrl.register);

router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], authCtrl.login);

router.post('/refresh', authCtrl.refreshToken);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);

router.get('/me', protect, authCtrl.getMe);
router.put('/profile', protect, authCtrl.updateProfile);
router.put('/change-password', protect, authCtrl.changePassword);
router.put('/change-email', protect, authCtrl.changeEmail);

module.exports = router;
