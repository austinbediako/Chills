import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Interaction from '../models/Interaction.js';
import ReviewNote from '../models/ReviewNote.js';
import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import slugify from '../utils/slugify.js';
import { validationResult } from 'express-validator';
import { analyzeSubmission, executeMachineCallback } from '../services/moderationService.js';

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Public
export const getSubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, tag, search, sort = '-createdAt', status, author } = req.query;
  
  const query = {};
  
  if (category && category !== 'All') {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    } else {
      const foundCat = await Category.findOne({
        $or: [
          { slug: category.toLowerCase() },
          { name: new RegExp(`^${category}$`, 'i') }
        ]
      });
      if (foundCat) {
        query.category = foundCat._id;
      }
    }
  }
  if (tag) {
    const escapedTag = tag.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.tags = { $regex: new RegExp(`^${escapedTag}$`, 'i') };
  }
  if (search) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { abstract: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } }
    ];
  }
  
  // Visibility rules:
  // Drafts must NEVER be seen by anybody except the actual author (not even admin).
  // Feeds and general listings must NEVER show drafts.
  if (author) {
    query.author = author;
    if (req.user && req.user._id.toString() === author) {
      if (status) query.status = status;
    } else {
      query.status = 'PUBLISHED';
      query.isDraft = { $ne: true };
    }
  } else {
    // General feeds strictly only show PUBLISHED stories, never drafts
    query.status = 'PUBLISHED';
    query.isDraft = { $ne: true };
  }
  
  const total = await Submission.countDocuments(query);
  
  const rawSubmissions = await Submission.find(query)
    .populate('author', 'name username avatar')
    .populate('category', 'name slug')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const submissionIds = rawSubmissions.map(s => s._id);
  const [likesAggregation, commentsAggregation, repostsAggregation, userLikes, userReposts] = await Promise.all([
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'LIKE' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    Comment.aggregate([
      { $match: { submission: { $in: submissionIds }, isFlagged: false } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'REPOST' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    req.user ? Interaction.find({ submission: { $in: submissionIds }, user: req.user._id, type: 'LIKE' }).select('submission') : [],
    req.user ? Interaction.find({ submission: { $in: submissionIds }, user: req.user._id, type: 'REPOST' }).select('submission') : [],
  ]);
  
  const likesMap = {};
  likesAggregation.forEach(l => { likesMap[l._id.toString()] = l.count; });
  const commentsMap = {};
  commentsAggregation.forEach(c => { commentsMap[c._id.toString()] = c.count; });
  const repostsMap = {};
  repostsAggregation.forEach(r => { repostsMap[r._id.toString()] = r.count; });

  const userLikedSet = new Set(userLikes.map(l => l.submission.toString()));
  const userRepostedSet = new Set(userReposts.map(r => r.submission.toString()));
  
  const submissions = rawSubmissions.map(s => {
    const doc = s.toObject();
    const idStr = s._id.toString();
    doc.likes = likesMap[idStr] || 0;
    doc.likesCount = likesMap[idStr] || 0;
    doc.comments = commentsMap[idStr] || 0;
    doc.commentsCount = commentsMap[idStr] || 0;
    doc.reposts = repostsMap[idStr] || 0;
    doc.repostsCount = repostsMap[idStr] || 0;
    doc.isLiked = userLikedSet.has(idStr);
    doc.isReposted = userRepostedSet.has(idStr);
    return doc;
  });
  
  res.json({
    submissions,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalSubmissions: total,
  });
});

// @desc    Get popular tags from published submissions
// @route   GET /api/submissions/popular/tags
// @access  Public
export const getPopularTags = asyncHandler(async (req, res) => {
  const tagsAggregation = await Submission.aggregate([
    { $match: { status: 'PUBLISHED' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  
  const tags = tagsAggregation.map(t => ({ name: t._id, count: t.count }));
  res.json(tags);
});

// @desc    Get single submission by ID or slug
// @route   GET /api/submissions/:id
// @access  Public
export const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  
  let submission;
  if (isObjectId) {
    submission = await Submission.findById(id)
      .populate('author', 'name username avatar bio')
      .populate('category')
      .populate('draftRef', 'title slug updatedAt status isDraft')
      .populate('draftOf', 'title slug updatedAt status');
  } else {
    submission = await Submission.findOne({ slug: id })
      .populate('author', 'name username avatar bio')
      .populate('category')
      .populate('draftRef', 'title slug updatedAt status isDraft')
      .populate('draftOf', 'title slug updatedAt status');

    if (!submission) {
      submission = await Submission.findOne({ slug: new RegExp(`^${id}`, 'i') })
        .populate('author', 'name username avatar bio')
        .populate('category')
        .populate('draftRef', 'title slug updatedAt status isDraft')
        .populate('draftOf', 'title slug updatedAt status');
    }
  }
  
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Security check: Drafts can NEVER be viewed by anyone except the actual author (not even admin)
  if (submission.status === 'DRAFT' || submission.isDraft) {
    if (!req.user || submission.author._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Drafts can only be viewed and edited by their author');
    }
  } else if (submission.status !== 'PUBLISHED') {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized to view this submission');
    }
    const isAuthor = submission.author._id.toString() === req.user._id.toString();
    const isReviewer = req.user.role === 'reviewer' || req.user.role === 'admin';
    
    if (!isAuthor && !isReviewer) {
      res.status(403);
      throw new Error('Not authorized to view this submission');
    }
  }

  const comments = await Comment.find({ submission: submission._id, isFlagged: false })
    .populate('user', 'name username avatar')
    .sort('-createdAt');
  
  // Get interaction counts
  const likesCount = await Interaction.countDocuments({ submission: submission._id, type: 'LIKE' });
  const bookmarksCount = await Interaction.countDocuments({ submission: submission._id, type: 'BOOKMARK' });
  const repostsCount = await Interaction.countDocuments({ submission: submission._id, type: 'REPOST' });
  
  res.json({ submission, comments, likesCount, bookmarksCount, repostsCount });
});

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private
export const createSubmission = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  
  const { title, content, abstract, category, tags, image, isDraft, draftOf } = req.body;
  
  let slug = slugify(title) || `story-${Date.now()}`;
  const slugExists = await Submission.findOne({ slug });
  if (slugExists) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  
  // Calculate reading time
  const plainText = (content || '').replace(/<[^>]*>?/gm, ' ');
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  // Safely validate category ObjectId if provided
  const safeCategory = (category && mongoose.Types.ObjectId.isValid(category)) ? category : undefined;

  // Verify parent post if this is a draft revision of an existing published post
  let parentPost = null;
  if (draftOf && mongoose.Types.ObjectId.isValid(draftOf)) {
    parentPost = await Submission.findOne({ _id: draftOf, author: req.user._id });
  }

  const determinedIsDraft = isDraft !== undefined ? Boolean(isDraft) : false;
  const targetStatus = determinedIsDraft ? 'DRAFT' : 'PUBLISHED';

  // Run Content Moderation Scoring Algorithm
  const moderationResult = analyzeSubmission({
    title,
    abstract,
    content,
    tags: tags ? tags.map(tag => tag.trim()) : [],
  });

  const submission = new Submission({
    title,
    slug,
    content,
    abstract,
    author: req.user._id,
    category: safeCategory,
    tags: tags ? tags.map(tag => tag.trim()) : [],
    image: image || '',
    readTime,
    isDraft: determinedIsDraft,
    draftOf: parentPost ? parentPost._id : null,
    status: targetStatus,
    moderation: {
      ...moderationResult,
      callbackTriggeredAt: new Date(),
    },
  });
  
  const createdSubmission = await submission.save();

  // If this draft references a parent post, link it reciprocally on the parent post
  if (parentPost) {
    parentPost.draftRef = createdSubmission._id;
    await parentPost.save();
  }

  // Execute Machine Moderation Callback (prints directly to terminal console)
  if (targetStatus === 'PUBLISHED') {
    executeMachineCallback(createdSubmission, moderationResult, req.user);
  }

  res.status(201).json(createdSubmission);
});

// @desc    Update a submission
// @route   PUT /api/submissions/:id
// @access  Private (Author only)
export const updateSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, abstract, category, tags, image, isDraft, submitForReview } = req.body;
  
  const submission = await Submission.findById(id);
  
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }
  
  if (submission.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this submission');
  }
  
  let slug = submission.slug;
  if (title && title !== submission.title) {
    slug = slugify(title);
    const slugExists = await Submission.findOne({ slug, _id: { $ne: id } });
    if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  
  submission.title = title || submission.title;
  submission.slug = slug;
  submission.content = content !== undefined ? content : submission.content;
  submission.abstract = abstract !== undefined ? abstract : submission.abstract;
  if (category && mongoose.Types.ObjectId.isValid(category)) {
    submission.category = category;
  }
  if (image !== undefined) {
    submission.image = image;
  }
  
  if (content) {
    const plainText = content.replace(/<[^>]*>?/gm, ' ');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    submission.readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  }
  
  if (tags) {
    submission.tags = tags.map(tag => tag.trim());
  }

  let shouldTriggerCallback = false;

  // Publish straight away when submitting or saving non-draft
  if (submitForReview || isDraft === false) {
    submission.status = 'PUBLISHED';
    submission.isDraft = false;
    shouldTriggerCallback = true;
  } else if (isDraft !== undefined) {
    submission.isDraft = Boolean(isDraft);
    if (submission.isDraft) {
      submission.status = 'DRAFT';
    } else {
      submission.status = 'PUBLISHED';
      shouldTriggerCallback = true;
    }
  }

  // Run Content Moderation Scoring Algorithm
  const moderationResult = analyzeSubmission({
    title: submission.title,
    abstract: submission.abstract,
    content: submission.content,
    tags: submission.tags,
  });

  submission.moderation = {
    ...moderationResult,
    callbackTriggeredAt: new Date(),
  };
  
  const updatedSubmission = await submission.save();

  if (shouldTriggerCallback || submission.status === 'PUBLISHED') {
    executeMachineCallback(updatedSubmission, moderationResult, req.user);
  }

  res.json(updatedSubmission);
});

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private
export const deleteSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id);
  
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }
  
  if (submission.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this submission');
  }
  
  await Comment.deleteMany({ submission: id });
  await Interaction.deleteMany({ submission: id });
  await ReviewNote.deleteMany({ submission: id });
  
  await submission.deleteOne();
  res.json({ message: 'Submission removed' });
});

// @desc    Update submission status (Review workflow)
// @route   PUT /api/submissions/:id/status
// @access  Private (Reviewer/Admin)
export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;

  const validStatuses = ['APPROVED', 'REVISIONS_REQUESTED', 'REJECTED', 'PUBLISHED'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status transition');
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  if (comments) {
    await ReviewNote.create({
      submission: id,
      reviewer: req.user._id,
      comments,
      decision: status === 'PUBLISHED' ? 'APPROVED' : status
    });
  }

  submission.status = status;
  await submission.save();

  res.json(submission);
});

// @desc    Interact (Like/Bookmark/Repost) with a submission
// @route   POST /api/submissions/:id/interact
// @access  Private
export const interactSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, quote, folder, remove } = req.body; // 'LIKE', 'BOOKMARK', or 'REPOST'
  
  if (!['LIKE', 'BOOKMARK', 'REPOST'].includes(type)) {
    res.status(400);
    throw new Error('Invalid interaction type');
  }

  const submission = await Submission.findById(id);
  if (!submission || submission.status !== 'PUBLISHED') {
    res.status(404);
    throw new Error('Published submission not found');
  }
  
  const existingInteraction = await Interaction.findOne({
    submission: id,
    user: req.user._id,
    type
  });

  // Dedicated Bookmark Folder Management (zero duplicated story data)
  if (type === 'BOOKMARK') {
    if (remove === true) {
      if (existingInteraction) {
        await existingInteraction.deleteOne();
      }
      const count = await Interaction.countDocuments({ submission: id, type: 'BOOKMARK' });
      return res.json({
        message: 'Bookmark removed',
        action: 'removed',
        count,
        isInteracted: false,
        folder: null,
      });
    }

    if (existingInteraction) {
      if (folder !== undefined) {
        existingInteraction.folder = (folder || 'General').trim();
        await existingInteraction.save();
        const count = await Interaction.countDocuments({ submission: id, type: 'BOOKMARK' });
        return res.json({
          message: `Saved to ${existingInteraction.folder}`,
          action: 'updated',
          count,
          isInteracted: true,
          folder: existingInteraction.folder,
        });
      } else {
        // Toggle remove
        await existingInteraction.deleteOne();
        const count = await Interaction.countDocuments({ submission: id, type: 'BOOKMARK' });
        return res.json({
          message: 'Bookmark removed',
          action: 'removed',
          count,
          isInteracted: false,
          folder: null,
        });
      }
    } else {
      // Create new bookmark referencing submission ID and user ID
      const targetFolder = (folder || 'General').trim();
      const newInteraction = await Interaction.create({
        submission: id,
        user: req.user._id,
        type: 'BOOKMARK',
        folder: targetFolder,
      });
      const count = await Interaction.countDocuments({ submission: id, type: 'BOOKMARK' });
      return res.status(201).json({
        message: `Saved to ${targetFolder}`,
        action: 'added',
        count,
        isInteracted: true,
        folder: targetFolder,
        interaction: newInteraction,
      });
    }
  }

  if (existingInteraction) {
    // Toggle (Remove)
    await existingInteraction.deleteOne();
    const count = await Interaction.countDocuments({ submission: id, type });
    res.json({ message: `${type} removed`, action: 'removed', count, isInteracted: false });
  } else {
    // Add
    const interaction = await Interaction.create({
      submission: id,
      user: req.user._id,
      type,
      quote: quote || '',
    });
    const count = await Interaction.countDocuments({ submission: id, type });
    res.status(201).json({ message: `${type} added`, action: 'added', count, isInteracted: true, interaction });
  }
});

// @desc    Toggle Repost on a submission
// @route   POST /api/submissions/:id/repost
// @access  Private
export const toggleRepostSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quote } = req.body;

  const submission = await Submission.findById(id);
  if (!submission || submission.status !== 'PUBLISHED') {
    res.status(404);
    throw new Error('Published story not found');
  }

  const existingRepost = await Interaction.findOne({
    submission: id,
    user: req.user._id,
    type: 'REPOST',
  });

  if (existingRepost) {
    await existingRepost.deleteOne();
    const count = await Interaction.countDocuments({ submission: id, type: 'REPOST' });
    return res.json({
      message: 'Repost removed',
      action: 'unreposted',
      isReposted: false,
      repostsCount: count,
    });
  } else {
    const newRepost = await Interaction.create({
      submission: id,
      user: req.user._id,
      type: 'REPOST',
      quote: quote || '',
    });
    const count = await Interaction.countDocuments({ submission: id, type: 'REPOST' });
    return res.status(201).json({
      message: 'Reposted successfully',
      action: 'reposted',
      isReposted: true,
      repostsCount: count,
      repost: newRepost,
    });
  }
});

// @desc    Get Social Feed (X-style unified timeline of posts and reposts)
// @route   GET /api/submissions/feed
// @access  Public (Optional Auth)
export const getSocialFeed = asyncHandler(async (req, res) => {
  const { tab = 'for-you', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const currentUserId = req.user ? req.user._id : null;

  let postQuery = { status: 'PUBLISHED', isDraft: { $ne: true } };
  let repostQuery = { type: 'REPOST' };

  if (tab === 'following') {
    if (!req.user) {
      return res.json({
        items: [],
        page: pageNum,
        totalPages: 0,
        totalItems: 0,
        message: 'Sign in to see posts and reposts from people you follow.',
      });
    }

    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = (currentUser && Array.isArray(currentUser.following)) ? currentUser.following : [];

    if (followingIds.length === 0) {
      return res.json({
        items: [],
        page: pageNum,
        totalPages: 0,
        totalItems: 0,
        message: 'You are not following anyone yet. Discover creators in the "For You" tab or explore authors!',
      });
    }

    postQuery.author = { $in: followingIds };
    repostQuery.user = { $in: followingIds };
  }

  // Fetch posts
  const posts = await Submission.find(postQuery)
    .populate('author', 'name username avatar bio followers following')
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limitNum * 2)
    .lean();

  // Fetch reposts
  const rawReposts = await Interaction.find(repostQuery)
    .populate('user', 'name username avatar bio followers following')
    .populate({
      path: 'submission',
      match: { status: 'PUBLISHED', isDraft: { $ne: true } },
      populate: [
        { path: 'author', select: 'name username avatar bio followers following' },
        { path: 'category', select: 'name slug' }
      ]
    })
    .sort('-createdAt')
    .limit(limitNum * 2)
    .lean();

  // Filter out any reposts whose submissions might be missing or unpublished
  const validReposts = rawReposts.filter(r => r.submission && r.user);

  // Unify and transform into feed items
  const feedItems = [];

  for (const p of posts) {
    feedItems.push({
      _id: `post_${p._id}`,
      feedType: 'post',
      createdAt: p.createdAt,
      submission: p,
      repostUser: null,
      quote: null,
    });
  }

  for (const r of validReposts) {
    feedItems.push({
      _id: `repost_${r._id}`,
      feedType: 'repost',
      createdAt: r.createdAt,
      repostedAt: r.createdAt,
      submission: r.submission,
      repostUser: r.user,
      quote: r.quote || '',
    });
  }

  // Sort descending by chronological activity timestamp
  feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination slice
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = feedItems.slice(startIndex, startIndex + limitNum);
  const totalItems = feedItems.length;
  const totalPages = Math.ceil(totalItems / limitNum);

  // Aggregate engagement stats for all submissions in the paginated set
  const submissionIds = paginatedItems.map(item => item.submission._id);

  const [likesAgg, repostsAgg, commentsAgg, userInteractions] = await Promise.all([
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'LIKE' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'REPOST' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    Comment.aggregate([
      { $match: { submission: { $in: submissionIds }, isFlagged: false } },
      { $group: { _id: '$submission', count: { $sum: 1 } } }
    ]),
    currentUserId ? Interaction.find({
      submission: { $in: submissionIds },
      user: currentUserId,
    }).lean() : Promise.resolve([])
  ]);

  const likesMap = {};
  likesAgg.forEach(l => { likesMap[l._id.toString()] = l.count; });

  const repostsMap = {};
  repostsAgg.forEach(r => { repostsMap[r._id.toString()] = r.count; });

  const commentsMap = {};
  commentsAgg.forEach(c => { commentsMap[c._id.toString()] = c.count; });

  const userLikesSet = new Set();
  const userRepostsSet = new Set();
  const userBookmarksSet = new Set();
  const userBookmarkFolderMap = {};

  userInteractions.forEach(ui => {
    const key = ui.submission.toString();
    if (ui.type === 'LIKE') userLikesSet.add(key);
    if (ui.type === 'REPOST') userRepostsSet.add(key);
    if (ui.type === 'BOOKMARK') {
      userBookmarksSet.add(key);
      userBookmarkFolderMap[key] = ui.folder || 'General';
    }
  });

  // Fetch preview comments for each submission
  const recentCommentsMap = {};
  if (submissionIds.length > 0) {
    const previewComments = await Comment.find({
      submission: { $in: submissionIds },
      isFlagged: false,
    })
      .populate('user', 'name username avatar')
      .populate('replies.user', 'name username avatar')
      .sort('-createdAt')
      .lean();

    previewComments.forEach(comm => {
      const sId = comm.submission.toString();
      if (!recentCommentsMap[sId]) {
        recentCommentsMap[sId] = [];
      }
      recentCommentsMap[sId].push(comm);
    });
  }

  // Enrich items
  const enrichedItems = paginatedItems.map(item => {
    const sId = item.submission._id.toString();
    const authorFollowers = item.submission.author?.followers || [];
    const isFollowingAuthor = currentUserId 
      ? authorFollowers.some(f => f.toString() === currentUserId.toString())
      : false;

    return {
      ...item,
      likesCount: likesMap[sId] || 0,
      repostsCount: repostsMap[sId] || 0,
      commentsCount: commentsMap[sId] || 0,
      isLiked: userLikesSet.has(sId),
      isReposted: userRepostsSet.has(sId),
      isBookmarked: userBookmarksSet.has(sId),
      bookmarkFolder: userBookmarkFolderMap[sId] || null,
      isFollowingAuthor,
      previewComments: (recentCommentsMap[sId] || []).slice(0, 3),
    };
  });

  res.json({
    items: enrichedItems,
    page: pageNum,
    totalPages,
    totalItems,
  });
});

// @desc    Get moderation audit logs and stats for the machine
// @route   GET /api/submissions/moderation/audit
// @access  Private (Reviewer/Admin only)
export const getModerationAudit = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, flagged, category, grade, search } = req.query;

  const query = {
    status: 'PUBLISHED',
    isDraft: { $ne: true },
  };

  if (flagged === 'true') {
    query['moderation.flagged'] = true;
  } else if (flagged === 'false') {
    query['moderation.flagged'] = false;
  }

  if (grade) {
    query['moderation.grade'] = grade.toUpperCase();
  }

  if (category) {
    const catField = category === '18+' ? 'eighteenPlus' : category.toLowerCase();
    query[`moderation.categories.${catField}.flagged`] = true;
  }

  if (search && search.trim()) {
    query.$or = [
      { title: new RegExp(search.trim(), 'i') },
      { 'moderation.labels': new RegExp(search.trim(), 'i') },
      { tags: new RegExp(search.trim(), 'i') },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const totalSubmissions = await Submission.countDocuments(query);
  const submissions = await Submission.find(query)
    .populate('author', 'name username email avatar')
    .populate('category', 'name slug')
    .sort({ 'moderation.overallScore': -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Compute overall machine statistics strictly for published stories (never drafts)
  const baseFilter = { status: 'PUBLISHED', isDraft: { $ne: true } };
  const [totalCount, flaggedCount, criticalCount, sexistCount, sexualCount, explicitCount, eighteenPlusCount, racistCount] = await Promise.all([
    Submission.countDocuments(baseFilter),
    Submission.countDocuments({ ...baseFilter, 'moderation.flagged': true }),
    Submission.countDocuments({ ...baseFilter, 'moderation.grade': 'CRITICAL' }),
    Submission.countDocuments({ ...baseFilter, 'moderation.categories.sexist.flagged': true }),
    Submission.countDocuments({ ...baseFilter, 'moderation.categories.sexual.flagged': true }),
    Submission.countDocuments({ ...baseFilter, 'moderation.categories.explicit.flagged': true }),
    Submission.countDocuments({ ...baseFilter, 'moderation.categories.eighteenPlus.flagged': true }),
    Submission.countDocuments({ ...baseFilter, 'moderation.categories.racist.flagged': true }),
  ]);

  res.json({
    submissions,
    totalSubmissions,
    totalPages: Math.ceil(totalSubmissions / limitNum),
    currentPage: pageNum,
    stats: {
      totalCount,
      flaggedCount,
      cleanCount: totalCount - flaggedCount,
      criticalCount,
      sexistCount,
      sexualCount,
      explicitCount,
      eighteenPlusCount,
      racistCount,
    },
  });
});

// @desc    Rescan all submissions with the machine moderation algorithm
// @route   POST /api/submissions/moderation/rescan-all
// @access  Private (Reviewer/Admin only)
export const rescanAllSubmissions = asyncHandler(async (req, res) => {
  const allSubmissions = await Submission.find({ status: 'PUBLISHED', isDraft: { $ne: true } }).populate('author', 'name username email');
  let scanned = 0;
  let flagged = 0;

  console.log(`\n🤖 [MACHINE BATCH AUDIT] Starting full scan across ${allSubmissions.length} stories...`);

  for (const sub of allSubmissions) {
    const result = analyzeSubmission({
      title: sub.title,
      abstract: sub.abstract,
      content: sub.content,
      tags: sub.tags,
    });

    sub.moderation = {
      ...result,
      callbackTriggeredAt: new Date(),
    };
    await sub.save();
    scanned++;
    if (result.flagged) {
      flagged++;
      executeMachineCallback(sub, result, sub.author);
    }
  }

  console.log(`🤖 [MACHINE BATCH AUDIT COMPLETE] Scanned: ${scanned} | Flagged: ${flagged}\n`);

  res.json({
    message: `Rescanned ${scanned} submissions. ${flagged} flagged for moderation.`,
    scannedCount: scanned,
    flaggedCount: flagged,
  });
});

// @desc    Scan and return machine moderation result for a single submission
// @route   POST /api/submissions/:id/moderate
// @access  Private (Reviewer/Admin only)
export const moderateSingleSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id).populate('author', 'name username email avatar');

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  if (submission.status === 'DRAFT' || submission.isDraft) {
    res.status(400);
    throw new Error('Drafts are private and cannot be audited by the machine moderation system');
  }

  const result = analyzeSubmission({
    title: submission.title,
    abstract: submission.abstract,
    content: submission.content,
    tags: submission.tags,
  });

  submission.moderation = {
    ...result,
    callbackTriggeredAt: new Date(),
  };

  await submission.save();

  // Execute callback to machine
  executeMachineCallback(submission, result, submission.author);

  res.json(submission);
});

// @desc    Intelligent Multi-Dimensional Search Algorithm (Top, Latest, People, Media, Topics)
// @route   GET /api/submissions/search/explore
// @access  Public
export const searchExplore = asyncHandler(async (req, res) => {
  const { q = '', tab = 'top', page = 1, limit = 25 } = req.query;
  const rawQ = String(q || '').trim();
  const cleanQ = rawQ.replace(/^#/, '').replace(/^@/, '').trim();
  const escapedQ = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (!cleanQ) {
    return res.json({
      tab,
      stories: [],
      people: [],
      topics: [],
      spotlightPeople: [],
      total: 0,
    });
  }

  const currentUserId = req.user?._id?.toString();

  // Helper: Get user engagement map for a set of story IDs
  const getEngagementMetrics = async (storyIds) => {
    if (!storyIds || storyIds.length === 0) {
      return { likes: {}, comments: {}, reposts: {}, userLikes: new Set(), userReposts: new Set() };
    }
    const [likesAgg, commentsAgg, repostsAgg, uLikes, uReposts] = await Promise.all([
      Interaction.aggregate([
        { $match: { submission: { $in: storyIds }, type: 'LIKE' } },
        { $group: { _id: '$submission', count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { submission: { $in: storyIds }, isFlagged: false } },
        { $group: { _id: '$submission', count: { $sum: 1 } } },
      ]),
      Interaction.aggregate([
        { $match: { submission: { $in: storyIds }, type: 'REPOST' } },
        { $group: { _id: '$submission', count: { $sum: 1 } } },
      ]),
      req.user ? Interaction.find({ submission: { $in: storyIds }, user: req.user._id, type: 'LIKE' }).select('submission') : [],
      req.user ? Interaction.find({ submission: { $in: storyIds }, user: req.user._id, type: 'REPOST' }).select('submission') : [],
    ]);
    const likes = {};
    likesAgg.forEach((l) => {
      likes[l._id.toString()] = l.count;
    });
    const comments = {};
    commentsAgg.forEach((c) => {
      comments[c._id.toString()] = c.count;
    });
    const reposts = {};
    repostsAgg.forEach((r) => {
      reposts[r._id.toString()] = r.count;
    });
    const userLikes = new Set(uLikes.map((l) => l.submission.toString()));
    const userReposts = new Set(uReposts.map((r) => r.submission.toString()));
    return { likes, comments, reposts, userLikes, userReposts };
  };

  // 1. PEOPLE SEARCH ALGORITHM
  const searchPeople = async (maxLimit = 20) => {
    const peopleMatches = await User.find({
      $or: [
        { username: { $regex: escapedQ, $options: 'i' } },
        { name: { $regex: escapedQ, $options: 'i' } },
        { bio: { $regex: escapedQ, $options: 'i' } },
      ],
    })
      .select('name username avatar bio role followers following createdAt')
      .lean();

    const lowerQ = cleanQ.toLowerCase();

    // Score and rank people
    const scoredPeople = await Promise.all(
      peopleMatches.map(async (u) => {
        let personScore = 0;
        const uName = (u.username || '').toLowerCase();
        const rName = (u.name || '').toLowerCase();
        const bio = (u.bio || '').toLowerCase();

        if (uName === lowerQ) personScore += 120;
        else if (uName.startsWith(lowerQ)) personScore += 70;
        else if (uName.includes(lowerQ)) personScore += 40;

        if (rName === lowerQ) personScore += 80;
        else if (rName.startsWith(lowerQ)) personScore += 50;
        else if (rName.includes(lowerQ)) personScore += 30;

        if (bio.includes(lowerQ)) personScore += 15;

        const followersCount = Array.isArray(u.followers) ? u.followers.length : 0;
        const followingCount = Array.isArray(u.following) ? u.following.length : 0;
        personScore += Math.min(followersCount * 5, 100);

        const storiesCount = await Submission.countDocuments({ author: u._id, status: 'PUBLISHED' });
        personScore += Math.min(storiesCount * 10, 80);

        const isFollowing = currentUserId && Array.isArray(u.followers)
          ? u.followers.some((f) => f.toString() === currentUserId)
          : false;

        return {
          ...u,
          followersCount,
          followingCount,
          storiesCount,
          isFollowing,
          personScore,
        };
      })
    );

    return scoredPeople.sort((a, b) => b.personScore - a.personScore).slice(0, maxLimit);
  };

  // 2. TOPICS SEARCH ALGORITHM
  const searchTopics = async () => {
    const [tagsAgg, categoriesMatch] = await Promise.all([
      Submission.aggregate([
        { $match: { status: 'PUBLISHED', isDraft: { $ne: true } } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: escapedQ, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      Category.find({
        $or: [
          { name: { $regex: escapedQ, $options: 'i' } },
          { slug: { $regex: escapedQ, $options: 'i' } },
        ],
      }).lean(),
    ]);

    const topics = [];
    categoriesMatch.forEach((c) => {
      topics.push({
        name: c.name,
        slug: c.slug,
        type: 'category',
        count: null,
      });
    });

    tagsAgg.forEach((t) => {
      topics.push({
        name: t._id,
        slug: t._id,
        type: 'tag',
        count: t.count,
      });
    });

    return topics;
  };

  // Base story query for articles
  const baseStoryQuery = {
    status: 'PUBLISHED',
    isDraft: { $ne: true },
    $or: [
      { title: { $regex: escapedQ, $options: 'i' } },
      { abstract: { $regex: escapedQ, $options: 'i' } },
      { tags: { $regex: escapedQ, $options: 'i' } },
    ],
  };

  if (tab === 'people') {
    const people = await searchPeople(30);
    return res.json({
      tab: 'people',
      stories: [],
      spotlightPeople: [],
      people,
      topics: [],
      total: people.length,
    });
  }

  if (tab === 'topics') {
    const topics = await searchTopics();
    const relatedStoriesRaw = await Submission.find(baseStoryQuery)
      .populate('author', 'name username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const storyIds = relatedStoriesRaw.map((s) => s._id);
    const { likes, comments, reposts } = await getEngagementMetrics(storyIds);
    const relatedStories = relatedStoriesRaw.map((s) => ({
      ...s,
      likesCount: likes[s._id.toString()] || 0,
      commentsCount: comments[s._id.toString()] || 0,
      repostsCount: reposts[s._id.toString()] || 0,
    }));

    return res.json({
      tab: 'topics',
      stories: relatedStories,
      spotlightPeople: [],
      people: [],
      topics,
      total: topics.length,
    });
  }

  if (tab === 'media') {
    const mediaQuery = {
      ...baseStoryQuery,
      image: { $exists: true, $ne: '', $regex: /\S+/ },
    };
    const mediaStoriesRaw = await Submission.find(mediaQuery)
      .populate('author', 'name username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const storyIds = mediaStoriesRaw.map((s) => s._id);
    const { likes, comments, reposts } = await getEngagementMetrics(storyIds);
    const mediaStories = mediaStoriesRaw.map((s) => ({
      ...s,
      likesCount: likes[s._id.toString()] || 0,
      commentsCount: comments[s._id.toString()] || 0,
      repostsCount: reposts[s._id.toString()] || 0,
    }));

    return res.json({
      tab: 'media',
      stories: mediaStories,
      spotlightPeople: [],
      people: [],
      topics: [],
      total: mediaStories.length,
    });
  }

  if (tab === 'latest') {
    const latestStoriesRaw = await Submission.find(baseStoryQuery)
      .populate('author', 'name username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const storyIds = latestStoriesRaw.map((s) => s._id);
    const { likes, comments, reposts } = await getEngagementMetrics(storyIds);
    const latestStories = latestStoriesRaw.map((s) => ({
      ...s,
      likesCount: likes[s._id.toString()] || 0,
      commentsCount: comments[s._id.toString()] || 0,
      repostsCount: reposts[s._id.toString()] || 0,
    }));

    return res.json({
      tab: 'latest',
      stories: latestStories,
      spotlightPeople: [],
      people: [],
      topics: [],
      total: latestStories.length,
    });
  }

  // DEFAULT / TOP TAB: Intelligent Engagement & Relevance Algorithm
  const candidateStories = await Submission.find(baseStoryQuery)
    .populate('author', 'name username avatar')
    .populate('category', 'name slug')
    .limit(60)
    .lean();

  const storyIds = candidateStories.map((s) => s._id);
  const { likes, comments, reposts } = await getEngagementMetrics(storyIds);

  const lowerQ = cleanQ.toLowerCase();
  const qWords = lowerQ.split(/\s+/).filter(Boolean);

  // Compute Top Algorithm Score for each story
  const scoredStories = candidateStories.map((s) => {
    let relevance = 0;
    const titleLower = (s.title || '').toLowerCase();
    const abstractLower = (s.abstract || '').toLowerCase();
    const tagsArr = Array.isArray(s.tags) ? s.tags.map((t) => t.toLowerCase()) : [];

    // Exact phrase match
    if (titleLower.includes(lowerQ)) relevance += 60;
    if (tagsArr.includes(lowerQ)) relevance += 45;
    if (abstractLower.includes(lowerQ)) relevance += 25;

    // Word-level match
    qWords.forEach((word) => {
      if (titleLower.includes(word)) relevance += 20;
      if (tagsArr.some((t) => t.includes(word))) relevance += 15;
      if (abstractLower.includes(word)) relevance += 8;
    });

    const lCount = likes[s._id.toString()] || 0;
    const cCount = comments[s._id.toString()] || 0;
    const rCount = reposts[s._id.toString()] || 0;

    // Engagement weights: Reposts (5x), Comments (4x), Likes (3x)
    const engagementScore = (lCount * 3) + (cCount * 4) + (rCount * 5);

    // Recency multiplier: 168 hours (7 days) half-life decay
    const ageHours = Math.max(0, (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60));
    const recencyMultiplier = 1 / (1 + (ageHours / 168));

    // Final Top Score
    const topScore = ((relevance + 5) * 1.5) + (engagementScore * 20 * recencyMultiplier);

    return {
      ...s,
      likesCount: lCount,
      commentsCount: cCount,
      repostsCount: rCount,
      topScore,
      engagementScore,
    };
  });

  const topStories = scoredStories
    .sort((a, b) => b.topScore - a.topScore)
    .slice(0, parseInt(limit));

  // Spotlight People: Check if query matches authors strongly
  const spotlightPeople = await searchPeople(2);

  return res.json({
    tab: 'top',
    stories: topStories,
    spotlightPeople: spotlightPeople.filter((p) => p.personScore >= 40),
    people: [],
    topics: [],
    total: topStories.length,
  });
});

