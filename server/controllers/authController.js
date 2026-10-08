import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validationResult } from 'express-validator';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { username, email, password, name, gender } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    name,
    role:'admin',
    gender, // Include gender here
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      coverImage: user.coverImage || '',
      gender: user.gender,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.isActive === false) {
      res.status(403);
      throw new Error('This account has been deactivated. Please contact an administrator.');
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      coverImage: user.coverImage || '',
      gender: user.gender,
      role: user.role,
      isActive: user.isActive !== false,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      coverImage: user.coverImage || '',
      gender: user.gender,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.name = req.body.name || user.name;
    user.gender = req.body.gender || user.gender;

    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    if (req.body.coverImage !== undefined) {
      user.coverImage = req.body.coverImage;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      coverImage: updatedUser.coverImage || '',
      bio: updatedUser.bio,
      gender: updatedUser.gender,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Check if a username is available
// @route   GET /api/auth/check-username
// @access  Private
export const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const raw = String(req.query.username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  if (raw.length < 3 || raw.length > 30) {
    res.status(400);
    throw new Error('Username must be 3-30 characters and contain only letters, numbers, and underscores');
  }

  const query = { username: raw };
  if (req.user?._id) {
    query._id = { $ne: req.user._id };
  }

  const exists = await User.exists(query);

  res.json({ available: !exists });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email');
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid token');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
});

