import express from 'express';
import { check } from 'express-validator';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  checkUsernameAvailability
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('name', 'Name is required').not().isEmpty(),
    check('gender', 'Gender is required').not().isEmpty().isIn(['male', 'female', 'other']),
  ],
  registerUser
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  loginUser
);

// Get user profile
router.get('/profile', protect, getUserProfile);

// Update user profile
router.put('/profile', protect, updateUserProfile);

// Check username availability
router.get('/check-username', protect, checkUsernameAvailability);

export default router;