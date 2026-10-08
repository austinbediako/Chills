/**
 * Recommendation pipeline parameters.
 *
 * Adapted from the x-algorithm Home Mixer / Phoenix design.
 * Weights mirror the multi-action prediction combination used by the
 * weighted_scorer. Missing signals (video views, photo expand, dwell, etc.)
 * default to 0 and can be enabled once the app captures them.
 */

export const MAX_POST_AGE_DAYS = 30;
export const HISTORY_SEQ_LEN = 50;
export const CANDIDATE_POOL_SIZE = 150;
export const RESULT_SIZE = 12;
export const TOP_TAGS_LIMIT = 20;
export const TOP_CATEGORIES_LIMIT = 10;
export const IN_NETWORK_DAYS = 14;
export const OUT_OF_NETWORK_DAYS = 21;

// Diversity attenuation for repeated authors in a single feed response.
export const AUTHOR_DIVERSITY_DECAY = 0.85;
export const AUTHOR_DIVERSITY_FLOOR = 0.55;

// Weights for combining predicted engagement probabilities into a final score.
// Positive actions pull the score up; negative actions push it down.
export const ACTION_WEIGHTS = {
  favorite_score: 1.0,
  reply_score: 0.9,
  repost_score: 1.2,
  quote_score: 1.0,
  click_score: 0.25,
  profile_click_score: 0.15,
  share_score: 1.0,
  share_via_dm_score: 0.4,
  share_via_copy_link_score: 0.4,
  dwell_score: 0.3,
  photo_expand_score: 0.2,
  vqv_score: 0.0, // no video view data yet
  follow_author_score: 0.5,
  not_interested_score: -1.2,
  block_author_score: -2.0,
  mute_author_score: -1.5,
  report_score: -2.5,
  dwell_time: 0.0, // continuous; not used by the heuristic scorer today
};

// Heuristic scorer feature weights for the stand-in Phoenix scorer.
export const FEATURE_WEIGHTS = {
  author_followed: 0.55,
  tag_overlap: 0.35,
  category_match: 0.25,
  recency: 0.30,
  popularity: 0.20,
  comment_density: 0.15,
  has_image: 0.05,
  author_popularity: 0.10,
};

export const POPULARITY_NORMALIZATION = {
  like_weight: 1,
  repost_weight: 3,
  comment_weight: 2,
  scale: 50, // values above this are soft-capped
};
