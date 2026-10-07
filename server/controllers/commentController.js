import Comment from '../models/Comment.js';
import Submission from '../models/Submission.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validationResult } from 'express-validator';

// Basic Rule-Based Profanity Filter
const profanityList = ['badword1', 'badword2', 'toxic', 'idiot', 'stupid']; // Simplified for demo
const containsProfanity = (text) => {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
};

// @desc    Get all comments for a submission
// @route   GET /api/submissions/:id/comments
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
  const targetId = req.params.submissionId || req.params.id;
  if (!targetId) {
    res.status(400);
    throw new Error('Submission identifier is required');
  }

  const isObjectId = targetId.match(/^[0-9a-fA-F]{24}$/);
  const submission = isObjectId
    ? await Submission.findById(targetId)
    : await Submission.findOne({ $or: [{ slug: targetId }, { slug: new RegExp(`^${targetId}`, 'i') }] });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }
  
  const query = { submission: submission._id, isFlagged: false };

  const comments = await Comment.find(query)
    .populate('user', 'name username avatar')
    .populate('replies.user', 'name username avatar')
    .sort('-createdAt');
  
  res.json(comments);
});

// @desc    Add a comment
// @route   POST /api/submissions/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  
  const targetId = req.params.submissionId || req.params.id;
  if (!targetId) {
    res.status(400);
    throw new Error('Submission identifier is required');
  }

  const isObjectId = targetId.match(/^[0-9a-fA-F]{24}$/);
  const submission = isObjectId
    ? await Submission.findById(targetId)
    : await Submission.findOne({ $or: [{ slug: targetId }, { slug: new RegExp(`^${targetId}`, 'i') }] });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }
  
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized: user profile not found. Please log in again.');
  }
  
  const { content } = req.body;
  const isFlagged = containsProfanity(content);

  const comment = new Comment({
    submission: submission._id,
    user: req.user._id,
    content,
    isFlagged
  });
  
  const savedComment = await comment.save();
  await savedComment.populate('user', 'name username avatar');
  
  res.status(201).json(savedComment);
});

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  
  const { id } = req.params;
  const { content } = req.body;
  
  const comment = await Comment.findById(id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  
  if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this comment');
  }
  
  comment.content = content;
  comment.isFlagged = containsProfanity(content);
  
  const updatedComment = await comment.save();
  await updatedComment.populate('user', 'name username avatar');
  
  res.json(updatedComment);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  
  if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }
  
  await comment.deleteOne();
  res.json({ message: 'Comment removed' });
});

// @desc    Add reply to a comment
// @route   POST /api/comments/:id/replies
// @access  Private
export const addReply = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  
  const { id } = req.params;
  const { content } = req.body;
  
  const comment = await Comment.findById(id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  
  const isFlagged = containsProfanity(content);

  // If reply is toxic, we can either block it or flag the parent comment.
  // We'll just block it for simplicity, or we could add isFlagged to replies.
  if (isFlagged) {
    res.status(400);
    throw new Error('Reply contains inappropriate content');
  }

  const reply = {
    user: req.user._id,
    content,
    date: Date.now(),
  };
  
  comment.replies.push(reply);
  await comment.save();
  
  await comment.populate('user', 'name username avatar');
  await comment.populate('replies.user', 'name username avatar');
  res.status(201).json(comment);
});

// @desc    Toggle like on a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleLikeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (!Array.isArray(comment.likedBy)) {
    comment.likedBy = [];
  }

  const userId = req.user._id.toString();
  const alreadyLiked = comment.likedBy.some(u => u.toString() === userId);

  if (alreadyLiked) {
    comment.likedBy = comment.likedBy.filter(u => u.toString() !== userId);
    comment.likes = Math.max(0, (comment.likes || 1) - 1);
  } else {
    comment.likedBy.push(req.user._id);
    comment.likes = (comment.likes || 0) + 1;
  }

  await comment.save();
  await comment.populate('user', 'name username avatar');
  await comment.populate('replies.user', 'name username avatar');

  res.json({
    _id: comment._id,
    likes: comment.likes,
    likedBy: comment.likedBy,
    isLiked: !alreadyLiked,
    action: alreadyLiked ? 'unliked' : 'liked',
    comment,
  });
});

// @desc    Toggle like on a reply
// @route   POST /api/comments/:id/replies/:replyId/like
// @access  Private
export const toggleLikeReply = asyncHandler(async (req, res) => {
  const { id, replyId } = req.params;
  const comment = await Comment.findById(id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const reply = comment.replies.id(replyId);
  if (!reply) {
    res.status(404);
    throw new Error('Reply not found');
  }

  if (!Array.isArray(reply.likedBy)) {
    reply.likedBy = [];
  }

  const userId = req.user._id.toString();
  const alreadyLiked = reply.likedBy.some(u => u.toString() === userId);

  if (alreadyLiked) {
    reply.likedBy = reply.likedBy.filter(u => u.toString() !== userId);
  } else {
    reply.likedBy.push(req.user._id);
  }

  await comment.save();
  await comment.populate('user', 'name username avatar');
  await comment.populate('replies.user', 'name username avatar');

  res.json({
    _id: reply._id,
    likesCount: reply.likedBy.length,
    isLiked: !alreadyLiked,
    action: alreadyLiked ? 'unliked' : 'liked',
    comment,
  });
});