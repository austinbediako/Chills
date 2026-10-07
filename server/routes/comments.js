import express from 'express';
import { check } from 'express-validator';
import {
  updateComment,
  deleteComment,
  addReply,
  toggleLikeComment,
  toggleLikeReply,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Like / unlike comment
router.post('/:id/like', protect, toggleLikeComment);

// Add threaded reply to comment
router.post(
  '/:id/replies',
  protect,
  [
    check('content', 'Reply content is required').not().isEmpty(),
  ],
  addReply
);

// Like / unlike reply
router.post('/:id/replies/:replyId/like', protect, toggleLikeReply);

// Update comment
router.put(
  '/:id',
  protect,
  [
    check('content', 'Comment content is required').not().isEmpty(),
  ],
  updateComment
);

// Delete comment
router.delete('/:id', protect, deleteComment);

export default router;
