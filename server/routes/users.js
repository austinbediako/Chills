import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Interaction from '../models/Interaction.js';
import Comment from '../models/Comment.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Helper to resolve user by username or ObjectId
async function findUserByIdentifier(identifier) {
  const clean = String(identifier || '').trim().replace(/^@/, '');
  if (mongoose.Types.ObjectId.isValid(clean)) {
    const byId = await User.findById(clean).select('-password');
    if (byId) return byId;
  }
  return await User.findOne({ username: new RegExp(`^${clean}$`, 'i') }).select('-password');
}

// @desc    Featured Authors Algorithm
// @route   GET /api/users/featured-authors
// @access  Public
router.get(
  '/featured-authors',
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select('name username avatar bio role followers following');

    const rankedAuthors = await Promise.all(
      users.map(async (u) => {
        const storiesCount = await Submission.countDocuments({ author: u._id, status: 'PUBLISHED' });
        
        const authorStories = await Submission.find({ author: u._id, status: 'PUBLISHED' }).select('_id');
        const storyIds = authorStories.map((s) => s._id);
        const totalLikes = storyIds.length > 0 
          ? await Interaction.countDocuments({ submission: { $in: storyIds }, type: 'LIKE' })
          : 0;

        const followersCount = Array.isArray(u.followers) ? u.followers.length : 0;
        const followingCount = Array.isArray(u.following) ? u.following.length : 0;

        // Algorithm score: storiesCount * 20 + totalLikes * 8 + followersCount * 12
        const score = (storiesCount * 20) + (totalLikes * 8) + (followersCount * 12);

        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          role: u.role,
          storiesCount,
          totalLikes,
          followersCount,
          followingCount,
          featuredScore: score,
        };
      })
    );

    const featured = rankedAuthors
      .filter((a) => a.storiesCount > 0 || a.featuredScore > 0)
      .sort((a, b) => b.featuredScore - a.featuredScore)
      .slice(0, 12);

    res.json(featured.length > 0 ? featured : rankedAuthors.slice(0, 8));
  })
);

// @desc    Search authors
// @route   GET /api/users/search
// @access  Public
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q = '' } = req.query;
    if (!q.trim()) {
      return res.json([]);
    }
    const cleanQ = q.trim().replace(/^@/, '');
    const users = await User.find({
      $or: [
        { name: new RegExp(cleanQ, 'i') },
        { username: new RegExp(cleanQ, 'i') },
      ],
    })
      .select('name username avatar bio role followers following')
      .limit(10);

    res.json(users);
  })
);

// @desc    Get current user's bookmarks (organized by folder, zero duplicated story data)
// @route   GET /api/users/bookmarks
// @access  Private
router.get(
  '/bookmarks',
  protect,
  asyncHandler(async (req, res) => {
    const { folder, search } = req.query;
    const query = { user: req.user._id, type: 'BOOKMARK' };

    if (folder && folder !== 'All') {
      query.folder = folder;
    }

    const interactions = await Interaction.find(query)
      .sort('-createdAt')
      .populate({
        path: 'submission',
        match: { status: 'PUBLISHED' },
        populate: [
          { path: 'author', select: 'name username avatar bio followers following' },
          { path: 'category', select: 'name slug' },
        ],
      })
      .lean();

    // Filter out any where submission is null (e.g. deleted or unpublished)
    let validBookmarks = interactions.filter((i) => i.submission);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      validBookmarks = validBookmarks.filter((i) => {
        const title = (i.submission.title || '').toLowerCase();
        const abstract = (i.submission.abstract || '').toLowerCase();
        const author = (i.submission.author?.name || '').toLowerCase();
        return title.includes(q) || abstract.includes(q) || author.includes(q);
      });
    }

    // Get all distinct folders for current user
    const userFolders = await Interaction.distinct('folder', {
      user: req.user._id,
      type: 'BOOKMARK',
    });

    const foldersList = Array.from(new Set(['General', ...(userFolders || []).filter(Boolean)]));

    res.json({
      bookmarks: validBookmarks.map((i) => ({
        _id: i._id,
        folder: i.folder || 'General',
        createdAt: i.createdAt,
        submission: i.submission,
      })),
      folders: foldersList,
      totalCount: validBookmarks.length,
    });
  })
);

// @desc    Get current user's distinct bookmark folders
// @route   GET /api/users/bookmark-folders
// @access  Private
router.get(
  '/bookmark-folders',
  protect,
  asyncHandler(async (req, res) => {
    const userFolders = await Interaction.distinct('folder', {
      user: req.user._id,
      type: 'BOOKMARK',
    });

    const foldersList = Array.from(new Set(['General', ...(userFolders || []).filter(Boolean)]));
    res.json(foldersList);
  })
);

// @desc    Rename bookmark folder
// @route   PUT /api/users/bookmark-folders
// @access  Private
router.put(
  '/bookmark-folders',
  protect,
  asyncHandler(async (req, res) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      res.status(400);
      throw new Error('Both oldName and newName are required');
    }

    await Interaction.updateMany(
      { user: req.user._id, type: 'BOOKMARK', folder: oldName.trim() },
      { $set: { folder: newName.trim() } }
    );

    res.json({ message: `Folder renamed to ${newName.trim()}` });
  })
);

// @desc    Delete bookmark folder (moves bookmarks to General)
// @route   DELETE /api/users/bookmark-folders/:folderName
// @access  Private
router.delete(
  '/bookmark-folders/:folderName',
  protect,
  asyncHandler(async (req, res) => {
    const { folderName } = req.params;
    if (folderName === 'General') {
      res.status(400);
      throw new Error('Default folder cannot be deleted');
    }

    await Interaction.updateMany(
      { user: req.user._id, type: 'BOOKMARK', folder: folderName },
      { $set: { folder: 'General' } }
    );

    res.json({ message: `Folder ${folderName} removed, bookmarks moved to General` });
  })
);

// @desc    Get detailed Author Profile with social stats
// @route   GET /api/users/profile/:identifier
// @access  Public (optional auth for follow status)
router.get(
  '/profile/:identifier',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const targetUser = await findUserByIdentifier(req.params.identifier);
    if (!targetUser) {
      res.status(404);
      throw new Error('Author not found');
    }

    const storiesCount = await Submission.countDocuments({ author: targetUser._id, status: 'PUBLISHED' });
    const authorStories = await Submission.find({ author: targetUser._id, status: 'PUBLISHED' }).select('_id');
    const storyIds = authorStories.map((s) => s._id);
    const totalLikesReceived = storyIds.length > 0
      ? await Interaction.countDocuments({ submission: { $in: storyIds }, type: 'LIKE' })
      : 0;

    const followersCount = Array.isArray(targetUser.followers) ? targetUser.followers.length : 0;
    const followingCount = Array.isArray(targetUser.following) ? targetUser.following.length : 0;

    const isFollowing = Boolean(
      req.user && targetUser.followers && targetUser.followers.some((f) => f.toString() === req.user._id.toString())
    );
    const isSelf = Boolean(req.user && targetUser._id.toString() === req.user._id.toString());

    res.json({
      _id: targetUser._id,
      name: targetUser.name,
      username: targetUser.username,
      avatar: targetUser.avatar,
      coverImage: targetUser.coverImage || '',
      bio: targetUser.bio,
      role: targetUser.role,
      gender: targetUser.gender,
      createdAt: targetUser.createdAt,
      followersCount,
      followingCount,
      storiesCount,
      totalLikesReceived,
      isFollowing,
      isSelf,
    });
  })
);

// @desc    Toggle Follow / Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
router.post(
  '/:id/follow',
  protect,
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetId === currentUserId) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!Array.isArray(targetUser.followers)) targetUser.followers = [];
    if (!Array.isArray(currentUser.following)) currentUser.following = [];

    const isAlreadyFollowing = targetUser.followers.some((f) => f.toString() === currentUserId);

    if (isAlreadyFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter((f) => f.toString() !== currentUserId);
      currentUser.following = currentUser.following.filter((f) => f.toString() !== targetId);
      await targetUser.save();
      await currentUser.save();

      res.json({
        message: `Unfollowed @${targetUser.username}`,
        action: 'unfollowed',
        isFollowing: false,
        followersCount: targetUser.followers.length,
      });
    } else {
      // Follow
      targetUser.followers.push(currentUser._id);
      currentUser.following.push(targetUser._id);
      await targetUser.save();
      await currentUser.save();

      res.json({
        message: `Now following @${targetUser.username}`,
        action: 'followed',
        isFollowing: true,
        followersCount: targetUser.followers.length,
      });
    }
  })
);

// @desc    Get author's followers
// @route   GET /api/users/:identifier/followers
// @access  Public (optionalAuth)
router.get(
  '/:identifier/followers',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const currentUserId = req.user?._id ? req.user._id.toString() : null;
    const followers = await User.find({ _id: { $in: author.followers || [] } })
      .select('name username avatar bio role isVerified followers following')
      .lean();

    const formatted = followers.map((u) => ({
      ...u,
      isFollowing: currentUserId
        ? Array.isArray(u.followers) && u.followers.some((f) => f.toString() === currentUserId)
        : false,
      isSelf: currentUserId ? u._id.toString() === currentUserId : false,
      followersCount: Array.isArray(u.followers) ? u.followers.length : 0,
      followingCount: Array.isArray(u.following) ? u.following.length : 0,
    }));

    res.json(formatted);
  })
);

// @desc    Get author's following
// @route   GET /api/users/:identifier/following
// @access  Public (optionalAuth)
router.get(
  '/:identifier/following',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const currentUserId = req.user?._id ? req.user._id.toString() : null;
    const following = await User.find({ _id: { $in: author.following || [] } })
      .select('name username avatar bio role isVerified followers following')
      .lean();

    const formatted = following.map((u) => ({
      ...u,
      isFollowing: currentUserId
        ? Array.isArray(u.followers) && u.followers.some((f) => f.toString() === currentUserId)
        : false,
      isSelf: currentUserId ? u._id.toString() === currentUserId : false,
      followersCount: Array.isArray(u.followers) ? u.followers.length : 0,
      followingCount: Array.isArray(u.following) ? u.following.length : 0,
    }));

    res.json(formatted);
  })
);

// @desc    Get author's posts (published stories)
// @route   GET /api/users/:identifier/posts
// @access  Public
router.get(
  '/:identifier/posts',
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const posts = await Submission.find({ author: author._id, status: 'PUBLISHED' })
      .sort('-createdAt')
      .populate('category', 'name slug')
      .populate('author', 'name username avatar');

    res.json(posts);
  })
);

// @desc    Get author's reposts (bookmarked / amplified stories)
// @route   GET /api/users/:identifier/reposts
// @access  Public
router.get(
  '/:identifier/reposts',
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const interactions = await Interaction.find({ user: author._id, type: { $in: ['REPOST', 'BOOKMARK'] } })
      .sort('-createdAt')
      .populate({
        path: 'submission',
        match: { status: 'PUBLISHED' },
        populate: [
          { path: 'author', select: 'name username avatar' },
          { path: 'category', select: 'name slug' },
        ],
      });

    const repostedStories = interactions
      .filter((i) => i.submission)
      .map((i) => ({
        ...i.submission.toObject(),
        repostedAt: i.createdAt,
        repostQuote: i.quote || '',
        repostUser: {
          _id: author._id,
          name: author.name,
          username: author.username,
          avatar: author.avatar,
        },
      }));

    res.json(repostedStories);
  })
);

// @desc    Get author's comments
// @route   GET /api/users/:identifier/comments
// @access  Public
router.get(
  '/:identifier/comments',
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const comments = await Comment.find({ user: author._id })
      .sort('-createdAt')
      .populate({
        path: 'submission',
        select: 'title slug abstract image category author',
        populate: [
          { path: 'author', select: 'name username avatar' },
          { path: 'category', select: 'name slug' },
        ],
      });

    res.json(comments);
  })
);

// @desc    Get author's liked stories
// @route   GET /api/users/:identifier/likes
// @access  Public
router.get(
  '/:identifier/likes',
  asyncHandler(async (req, res) => {
    const author = await findUserByIdentifier(req.params.identifier);
    if (!author) {
      res.status(404);
      throw new Error('Author not found');
    }

    const interactions = await Interaction.find({ user: author._id, type: 'LIKE' })
      .sort('-createdAt')
      .populate({
        path: 'submission',
        match: { status: 'PUBLISHED' },
        populate: [
          { path: 'author', select: 'name username avatar' },
          { path: 'category', select: 'name slug' },
        ],
      });

    const likedStories = interactions
      .filter((i) => i.submission)
      .map((i) => ({
        ...i.submission.toObject(),
        likedAt: i.createdAt,
      }));

    res.json(likedStories);
  })
);

// @desc    Get public authors list
// @route   GET /api/users/authors
// @access  Public
router.get(
  '/authors',
  asyncHandler(async (req, res) => {
    const authors = await User.find({})
      .select('name username avatar bio role createdAt followers following')
      .limit(30);
    res.json(authors);
  })
);

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
router.get(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
  })
);

// @desc    Get user by ID (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
router.get(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      if (typeof req.body.isActive === 'boolean') {
        user.isActive = req.body.isActive;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

// @desc    Toggle user active/deactivated status (admin)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
router.patch(
  '/:id/status',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot deactivate your own account');
      }

      user.isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : !user.isActive;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        message: updatedUser.isActive ? 'User account reactivated' : 'User account deactivated',
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

// @desc    Upload avatar
// @route   POST /api/users/upload
// @access  Private
router.post('/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const isRemote = req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'));
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  const imageUrl = isRemote ? req.file.path : `${baseUrl}/uploads/avatars/${req.file.filename}`;
  res.json({ imageUrl, folder: 'avatars' });
});

export default router;