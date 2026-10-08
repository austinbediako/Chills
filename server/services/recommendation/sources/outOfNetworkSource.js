import mongoose from 'mongoose';
import Submission from '../../../models/Submission.js';
import { OUT_OF_NETWORK_DAYS } from '../params.js';

const AUTHOR_SELECT = 'name username avatar bio followers following';
const CATEGORY_SELECT = 'name slug';

export async function getOutOfNetworkCandidates(userContext, limit = 75) {
  const minDate = new Date(Date.now() - OUT_OF_NETWORK_DAYS * 24 * 60 * 60 * 1000);

  const excludeIds = [];
  for (const id of userContext.following) {
    excludeIds.push(new mongoose.Types.ObjectId(id));
  }
  if (userContext.userId) {
    excludeIds.push(new mongoose.Types.ObjectId(userContext.userId));
  }

  const baseQuery = {
    status: 'PUBLISHED',
    isDraft: { $ne: true },
    createdAt: { $gte: minDate },
  };
  if (excludeIds.length) {
    baseQuery.author = { $nin: excludeIds };
  }

  const pools = [];

  // Interest-based pool: posts matching preferred tags or categories.
  if (userContext.preferredTags.length || userContext.preferredCategories.length) {
    const interestQuery = { ...baseQuery };
    const orClauses = [];
    if (userContext.preferredTags.length) {
      orClauses.push({ tags: { $in: userContext.preferredTags } });
    }
    if (userContext.preferredCategories.length) {
      const catIds = userContext.preferredCategories
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (catIds.length) {
        orClauses.push({ category: { $in: catIds } });
      }
    }
    interestQuery.$or = orClauses;

    pools.push(
      Submission.find(interestQuery)
        .populate('author', AUTHOR_SELECT)
        .populate('category', CATEGORY_SELECT)
        .sort('-createdAt')
        .limit(limit)
        .lean()
    );
  }

  // Broad recent pool ensures discovery when interests are sparse or for logged-out users.
  pools.push(
    Submission.find(baseQuery)
      .populate('author', AUTHOR_SELECT)
      .populate('category', CATEGORY_SELECT)
      .sort('-createdAt')
      .limit(limit)
      .lean()
  );

  const poolResults = await Promise.all(pools);
  const seen = new Set();
  const candidates = [];

  for (const results of poolResults) {
    for (const p of results) {
      const sid = p._id.toString();
      if (seen.has(sid)) continue;
      seen.add(sid);
      candidates.push({
        _id: `post_${p._id}`,
        feedType: 'post',
        createdAt: p.createdAt,
        submission: p,
        repostUser: null,
        quote: null,
        source: 'out-of-network',
      });
    }
  }

  return candidates;
}
