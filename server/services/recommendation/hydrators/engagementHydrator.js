import Interaction from '../../../models/Interaction.js';
import Comment from '../../../models/Comment.js';

export async function hydrateEngagement(candidates, currentUserId) {
  if (candidates.length === 0) return [];

  const submissionIds = candidates.map((c) => c.submission._id);
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const [likesAgg, repostsAgg, commentsAgg, userInteractions] = await Promise.all([
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'LIKE' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } },
    ]),
    Interaction.aggregate([
      { $match: { submission: { $in: submissionIds }, type: 'REPOST' } },
      { $group: { _id: '$submission', count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { submission: { $in: submissionIds }, isFlagged: false } },
      { $group: { _id: '$submission', count: { $sum: 1 } } },
    ]),
    currentUserId
      ? Interaction.find({ submission: { $in: submissionIds }, user: currentUserId }).lean()
      : Promise.resolve([]),
  ]);

  const likesMap = {};
  likesAgg.forEach((l) => { likesMap[l._id.toString()] = l.count; });

  const repostsMap = {};
  repostsAgg.forEach((r) => { repostsMap[r._id.toString()] = r.count; });

  const commentsMap = {};
  commentsAgg.forEach((c) => { commentsMap[c._id.toString()] = c.count; });

  const userLikes = new Set();
  const userReposts = new Set();
  const userBookmarks = new Set();
  const userBookmarkFolderMap = {};

  userInteractions.forEach((ui) => {
    const sid = ui.submission.toString();
    if (ui.type === 'LIKE') userLikes.add(sid);
    if (ui.type === 'REPOST') userReposts.add(sid);
    if (ui.type === 'BOOKMARK') {
      userBookmarks.add(sid);
      userBookmarkFolderMap[sid] = ui.folder || 'General';
    }
  });

  return candidates.map((c) => {
    const sId = c.submission._id.toString();
    const authorFollowers = c.submission.author?.followers || [];
    const isFollowingAuthor = currentUserIdStr
      ? authorFollowers.some((f) => f.toString() === currentUserIdStr)
      : false;

    return {
      ...c,
      likesCount: likesMap[sId] || 0,
      repostsCount: repostsMap[sId] || 0,
      commentsCount: commentsMap[sId] || 0,
      isLiked: userLikes.has(sId),
      isReposted: userReposts.has(sId),
      isBookmarked: userBookmarks.has(sId),
      bookmarkFolder: userBookmarkFolderMap[sId] || null,
      isFollowingAuthor,
    };
  });
}
