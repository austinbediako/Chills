import express from 'express';
import { check } from 'express-validator';
import { 
  getSubmissions, 
  getSubmissionById, 
  createSubmission, 
  updateSubmission, 
  deleteSubmission,
  updateSubmissionStatus,
  interactSubmission,
  getPopularTags,
  getModerationAudit,
  rescanAllSubmissions,
  moderateSingleSubmission,
  getSocialFeed,
  toggleRepostSubmission
} from '../controllers/submissionController.js';
import { addComment, getComments } from '../controllers/commentController.js';
import { protect, optionalAuth, isAuthorOrAdmin, isReviewer } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get social feed (X / Twitter style merged timeline of stories & reposts)
router.get('/feed', optionalAuth, getSocialFeed);

// Get all submissions (public articles + author's own drafts if logged in)
router.get('/', optionalAuth, getSubmissions);

// Get popular tags
router.get('/popular/tags', getPopularTags);

// Machine Moderation Audit & Batch Rescan (Reviewer/Admin only)
router.get('/moderation/audit', protect, isReviewer, getModerationAudit);
router.post('/moderation/rescan-all', protect, isReviewer, rescanAllSubmissions);
router.post('/:id/moderate', protect, isReviewer, moderateSingleSubmission);

// Get comments for a submission
router.get('/:id/comments', getComments);

// Get single submission (public article or author's own draft if logged in)
router.get('/:id', optionalAuth, getSubmissionById);

// Create a submission (Draft or Pending)
router.post(
  '/',
  protect,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('abstract', 'Abstract is required').not().isEmpty(),
  ],
  createSubmission
);

// Update a submission (Author only)
router.put('/:id', protect, isAuthorOrAdmin, updateSubmission);

// Delete a submission
router.delete('/:id', protect, isAuthorOrAdmin, deleteSubmission);

// Reviewer/Admin Update Status
router.put('/:id/status', protect, isReviewer, updateSubmissionStatus);

// Interact (Like/Bookmark/Repost)
router.post('/:id/interact', protect, interactSubmission);

// Toggle Repost
router.post('/:id/repost', protect, toggleRepostSubmission);

// Add comment to submission
router.post(
  '/:id/comments',
  protect,
  [
    check('content', 'Comment content is required').not().isEmpty(),
  ],
  addComment
);

// Upload image (Cloudinary or local disk fallback, grouped by folder)
router.post('/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const isRemote = req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'));
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  
  const rawFolder = (req.query?.folder || req.body?.folder || '').toLowerCase().trim();
  const subfolder = ['covers', 'avatars', 'general'].includes(rawFolder) ? rawFolder : 'articles';
  
  const imageUrl = isRemote ? req.file.path : `${baseUrl}/uploads/${subfolder}/${req.file.filename}`;
  res.json({ imageUrl, folder: subfolder });
});

export default router;