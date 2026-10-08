import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validationResult } from 'express-validator';

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
