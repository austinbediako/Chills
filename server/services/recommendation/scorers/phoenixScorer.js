import { FEATURE_WEIGHTS, POPULARITY_NORMALIZATION } from '../params.js';

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function recencyScore(createdAt) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return Math.exp(-hours / 72);
}

function tagOverlap(candidateTags, preferredTags) {
  if (!candidateTags || candidateTags.length === 0 || preferredTags.length === 0) return 0;
  const preferredSet = new Set(preferredTags);
  const matches = candidateTags.filter((t) => preferredSet.has(t.toLowerCase().trim())).length;
  return matches / candidateTags.length;
}

function categoryMatch(submissionCategory, preferredCategories) {
  if (!preferredCategories.length) return 0;
  const catId = submissionCategory?._id?.toString?.() || submissionCategory?.toString?.() || null;
  return catId && preferredCategories.includes(catId) ? 1 : 0;
}

function popularityScore(c) {
  const raw =
    c.likesCount * POPULARITY_NORMALIZATION.like_weight +
    c.commentsCount * POPULARITY_NORMALIZATION.comment_weight +
    c.repostsCount * POPULARITY_NORMALIZATION.repost_weight;
  return Math.min(1, raw / POPULARITY_NORMALIZATION.scale);
}

function authorPopularityScore(c) {
  const followers = c.submission.author?.followers?.length || 0;
  return Math.min(1, followers / 1000);
}

export async function phoenixScore(candidates, context) {
  return candidates.map((c) => {
    const tags = c.submission.tags || [];
    const overlap = tagOverlap(tags, context.preferredTags);
    const catMatch = categoryMatch(c.submission.category, context.preferredCategories);
    const recency = recencyScore(c.submission.createdAt);
    const popularity = popularityScore(c);
    const authorPop = authorPopularityScore(c);
    const isFollowing = c.isFollowingAuthor;
    const hasImage = !!(c.submission.image && c.submission.image.trim());
    const engagementSum = Math.max(1, c.likesCount + c.commentsCount + c.repostsCount);
    const commentDensity = c.commentsCount / engagementSum;
    const repostDensity = c.repostsCount / engagementSum;

    // Probability the user will favorite/like the post.
    const favoriteLogit =
      0.05 +
      (isFollowing ? FEATURE_WEIGHTS.author_followed : 0) +
      overlap * FEATURE_WEIGHTS.tag_overlap +
      catMatch * FEATURE_WEIGHTS.category_match +
      recency * FEATURE_WEIGHTS.recency +
      popularity * FEATURE_WEIGHTS.popularity +
      (hasImage ? FEATURE_WEIGHTS.has_image : 0) +
      authorPop * FEATURE_WEIGHTS.author_popularity;

    const favorite_score = clamp(sigmoid(favoriteLogit * 4));

    // Probability the user will reply/comment.
    const replyLogit =
      0.02 +
      commentDensity * FEATURE_WEIGHTS.comment_density +
      overlap * 0.25 +
      catMatch * 0.15;
    const reply_score = clamp(sigmoid(replyLogit * 5));

    // Probability the user will repost.
    const repostLogit =
      0.03 +
      (isFollowing ? FEATURE_WEIGHTS.author_followed * 0.6 : 0) +
      repostDensity * 0.4 +
      overlap * 0.2 +
      popularity * 0.1;
    const repost_score = clamp(sigmoid(repostLogit * 4));

    // Probability of any click/open.
    const clickLogit =
      0.1 +
      recency * 0.2 +
      (isFollowing ? 0.2 : 0) +
      popularity * 0.1;
    const click_score = clamp(sigmoid(clickLogit * 3));

    // Probability of clicking the author's profile.
    const profileClickLogit =
      0.02 +
      authorPop * FEATURE_WEIGHTS.author_popularity +
      (isFollowing ? 0.1 : 0);
    const profile_click_score = clamp(sigmoid(profileClickLogit * 3));

    // Probability of sharing (other than repost).
    const share_score = clamp(repost_score * 0.5 + favorite_score * 0.2);

    // Photo expand only meaningful if the post has an image.
    const photo_expand_score = hasImage ? clamp(0.1 + overlap * 0.15) : 0;

    // Dwell is approximated from reading time; not used heavily today.
    const readTimeMatch = (c.submission.readTime || '').match(/(\d+)/);
    const minutes = readTimeMatch ? parseInt(readTimeMatch[1], 10) : 1;
    const dwell_score = clamp(minutes / 10);

    // Quote is closely related to reposting.
    const quote_score = clamp(repost_score * 0.8);

    // Follow author is only meaningful for authors the viewer does not already follow.
    const followAuthorLogit =
      c.isFollowingAuthor
        ? -2
        : 0.02 + overlap * 0.2 + authorPop * FEATURE_WEIGHTS.author_popularity;
    const follow_author_score = c.isFollowingAuthor ? 0 : clamp(sigmoid(followAuthorLogit * 3));

    // Negative signals are not tracked by the current data model.
    const not_interested_score = 0;
    const block_author_score = 0;
    const mute_author_score = 0;
    const report_score = 0;
    const vqv_score = 0;
    const share_via_dm_score = share_score * 0.3;
    const share_via_copy_link_score = share_score * 0.4;
    const dwell_time = 0;
    const quoted_click_score = quote_score * 0.5;

    return {
      ...c,
      phoenixScores: {
        favorite_score,
        reply_score,
        repost_score,
        photo_expand_score,
        click_score,
        profile_click_score,
        vqv_score,
        share_score,
        share_via_dm_score,
        share_via_copy_link_score,
        dwell_score,
        quote_score,
        quoted_click_score,
        follow_author_score,
        not_interested_score,
        block_author_score,
        mute_author_score,
        report_score,
        dwell_time,
      },
    };
  });
}
