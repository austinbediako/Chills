import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';

// Protect routes - verify token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, token failed: user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Optional auth middleware - populates req.user if valid token provided, but continues if not
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // In optional auth, an invalid or expired token is ignored rather than throwing immediately
      console.warn('Optional auth token ignored:', error.message);
    }
  }

  next();
});

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Reviewer middleware
export const isReviewer = (req, res, next) => {
  if (req.user && (req.user.role === 'reviewer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a reviewer');
  }
};

// Check if user is the author or admin
export const isAuthorOrAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const resourceId = req.params.id;
  const model = req.baseUrl.includes('submissions') ? 'Submission' : 'Comment';
  
  const resource = await mongoose.model(model).findById(resourceId);
  
  if (!resource) {
    res.status(404);
    throw new Error(`${model} not found`);
  }

  // Check if user is the author
  const isAuthor = resource.author && resource.author.toString() === req.user._id.toString();
  const isCommentUser = resource.user && resource.user.toString() === req.user._id.toString();

  if (!isAuthor && !isCommentUser) {
    res.status(403);
    throw new Error('Not authorized, you are not the author');
  }

  next();
});