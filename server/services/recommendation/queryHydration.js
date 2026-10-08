import mongoose from 'mongoose';
import User from '../../models/User.js';
import Interaction from '../../models/Interaction.js';
import Comment from '../../models/Comment.js';
import { HISTORY_SEQ_LEN, TOP_TAGS_LIMIT, TOP_CATEGORIES_LIMIT } from './params.js';

export async function hydrateUserContext(userId) {
  const context = {
    userId: userId ? userId.toString() : null,
    following: new Set(),
    actionSequence: [],
    preferredTags: [],
    preferredCategories: [],
    likedSubmissionIds: new Set(),
    commentedSubmissionIds: new Set(),
    repostedSubmissionIds: new Set(),
  };

  if (!userId) return context;

  const user = await User.findById(userId).select('following').lean();
  if (user?.following?.length) {
    for (const id of user.following) {
      context.following.add(id.toString());
    }
  }

  const interactionPopulate = {
    path: 'submission',
    select: 'author tags category createdAt title',
    populate: { path: 'author', select: '_id followers' },
  };

  const commentPopulate = {
    path: 'submission',
    select: 'author tags category createdAt title',
    populate: { path: 'author', select: '_id followers' },
  };

  const [interactions, comments] = await Promise.all([
    Interaction.find({ user: userId })
      .sort('-createdAt')
      .limit(HISTORY_SEQ_LEN)
      .populate(interactionPopulate)
      .lean(),
    Comment.find({ user: userId })
      .sort('-createdAt')
      .limit(HISTORY_SEQ_LEN)
      .populate(commentPopulate)
      .lean(),
  ]);

  const actionRows = [];

  for (const i of interactions) {
    if (!i.submission) continue;
    const sid = i.submission._id.toString();
    if (i.type === 'LIKE') context.likedSubmissionIds.add(sid);
    if (i.type === 'REPOST') context.repostedSubmissionIds.add(sid);
    actionRows.push(buildActionRow(i.type, i.submission, i.createdAt));
  }

  for (const c of comments) {
    if (!c.submission) continue;
    context.commentedSubmissionIds.add(c.submission._id.toString());
    actionRows.push(buildActionRow('COMMENT', c.submission, c.createdAt));
  }

  actionRows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  context.actionSequence = actionRows.slice(0, HISTORY_SEQ_LEN);

  const tagCounts = {};
  const categoryCounts = {};
  for (const row of context.actionSequence) {
    for (const tag of row.tags) {
      const t = tag.toLowerCase().trim();
      if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
    if (row.category) {
      categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
    }
  }

  context.preferredTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TAGS_LIMIT)
    .map(([tag]) => tag);

  context.preferredCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_CATEGORIES_LIMIT)
    .map(([cat]) => cat);

  return context;
}

function buildActionRow(action, submission, timestamp) {
  return {
    action,
    submissionId: submission._id.toString(),
    authorId: submission.author?._id?.toString() || null,
    timestamp,
    tags: submission.tags || [],
    category: submission.category?.toString?.() || submission.category || null,
  };
}
