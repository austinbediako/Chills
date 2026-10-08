import { hydrateUserContext } from './queryHydration.js';
import { getInNetworkCandidates } from './sources/inNetworkSource.js';
import { getOutOfNetworkCandidates } from './sources/outOfNetworkSource.js';
import { hydrateEngagement } from './hydrators/engagementHydrator.js';
import { hydratePreviewComments } from './hydrators/previewCommentsHydrator.js';
import { dropDuplicates } from './filters/dropDuplicates.js';
import { ageFilter } from './filters/ageFilter.js';
import { selfPostFilter } from './filters/selfPostFilter.js';
import { previouslyServedFilter } from './filters/previouslyServedFilter.js';
import { coreDataHydrationFilter } from './filters/coreDataHydrationFilter.js';
import { moderationVisibilityFilter } from './filters/moderationVisibilityFilter.js';
import { phoenixScore } from './scorers/phoenixScorer.js';
import { weightedScore } from './scorers/weightedScorer.js';
import { authorDiversityScore } from './scorers/authorDiversityScorer.js';
import { selectTopK } from './selectors/topKSelector.js';
import { CANDIDATE_POOL_SIZE } from './params.js';

export async function runRecommendationPipeline({ user, page, limit, seenIds = [] }) {
  const userId = user ? user._id : null;

  let normalizedSeenIds = seenIds || [];
  if (!Array.isArray(normalizedSeenIds)) {
    normalizedSeenIds = String(normalizedSeenIds)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const context = await hydrateUserContext(userId);

  const sourceLimit = Math.ceil(CANDIDATE_POOL_SIZE / 2);

  const [inNetwork, outOfNetwork] = await Promise.all([
    getInNetworkCandidates(context, sourceLimit),
    getOutOfNetworkCandidates(context, sourceLimit),
  ]);

  let candidates = [...inNetwork, ...outOfNetwork];

  // Pre-scoring filters (mirroring Home Mixer pre-selection filters).
  candidates = await coreDataHydrationFilter(candidates);
  candidates = await dropDuplicates(candidates);
  candidates = await ageFilter(candidates);
  candidates = await selfPostFilter(candidates, context);
  candidates = await previouslyServedFilter(candidates, context, normalizedSeenIds);
  candidates = await moderationVisibilityFilter(candidates);

  // Hydrate engagement counts and viewer-specific flags for the candidate pool.
  candidates = await hydrateEngagement(candidates, userId);

  // Scoring (mirroring Phoenix scorer -> weighted scorer -> author diversity scorer).
  candidates = await phoenixScore(candidates, context);
  candidates = await weightedScore(candidates);
  candidates = await authorDiversityScore(candidates);

  // Select top-K for this page.
  const selected = selectTopK(candidates, page, limit);

  // Post-selection hydration and final visibility filter.
  selected.items = await hydratePreviewComments(selected.items);
  selected.items = await moderationVisibilityFilter(selected.items);

  return selected;
}
