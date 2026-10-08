import mongoose from 'mongoose';
import Submission from '../../../models/Submission.js';
import Interaction from '../../../models/Interaction.js';
import { IN_NETWORK_DAYS } from '../params.js';

const AUTHOR_SELECT = 'name username avatar bio followers following';
const CATEGORY_SELECT = 'name slug';

export async function getInNetworkCandidates(userContext, limit = 75) {
  if (!userContext.following.size) return [];

  const followingIds = Array.from(userContext.following).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const minDate = new Date(Date.now() - IN_NETWORK_DAYS * 24 * 60 * 60 * 1000);

  const [posts, rawReposts] = await Promise.all([
    Submission.find({
      status: 'PUBLISHED',
      isDraft: { $ne: true },
      author: { $in: followingIds },
      createdAt: { $gte: minDate },
    })
      .populate('author', AUTHOR_SELECT)
      .populate('category', CATEGORY_SELECT)
      .sort('-createdAt')
      .limit(limit)
      .lean(),
    Interaction.find({
      type: 'REPOST',
      user: { $in: followingIds },
      createdAt: { $gte: minDate },
    })
      .populate('user', AUTHOR_SELECT)
      .populate({
        path: 'submission',
        match: { status: 'PUBLISHED', isDraft: { $ne: true } },
        populate: [
          { path: 'author', select: AUTHOR_SELECT },
          { path: 'category', select: CATEGORY_SELECT },
        ],
      })
      .sort('-createdAt')
      .limit(limit)
      .lean(),
  ]);

  const candidates = [];

  for (const p of posts) {
    candidates.push({
      _id: `post_${p._id}`,
      feedType: 'post',
      createdAt: p.createdAt,
      submission: p,
      repostUser: null,
      quote: null,
      source: 'in-network',
    });
  }

  for (const r of rawReposts) {
    if (!r.submission || !r.user) continue;
    candidates.push({
      _id: `repost_${r._id}`,
      feedType: 'repost',
      createdAt: r.createdAt,
      repostedAt: r.createdAt,
      submission: r.submission,
      repostUser: r.user,
      quote: r.quote || '',
      source: 'in-network',
    });
  }

  return candidates;
}
