import Comment from '../../../models/Comment.js';

export async function hydratePreviewComments(candidates) {
  if (candidates.length === 0) return candidates;

  const submissionIds = candidates.map((c) => c.submission._id);
  const comments = await Comment.find({
    submission: { $in: submissionIds },
    isFlagged: false,
  })
    .populate('user', 'name username avatar')
    .populate('replies.user', 'name username avatar')
    .sort('-createdAt')
    .lean();

  const map = {};
  comments.forEach((c) => {
    const sid = c.submission.toString();
    if (!map[sid]) map[sid] = [];
    map[sid].push(c);
  });

  return candidates.map((c) => ({
    ...c,
    previewComments: (map[c.submission._id.toString()] || []).slice(0, 3),
  }));
}
