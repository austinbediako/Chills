import { AUTHOR_DIVERSITY_DECAY, AUTHOR_DIVERSITY_FLOOR } from '../params.js';

export async function authorDiversityScore(candidates) {
  const sorted = [...candidates].sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));
  const authorCounts = {};
  const scored = [];

  for (const c of sorted) {
    const authorId = c.submission.author?._id?.toString() || 'unknown';
    const position = authorCounts[authorId] || 0;
    authorCounts[authorId] = position + 1;
    const multiplier =
      (1 - AUTHOR_DIVERSITY_FLOOR) * Math.pow(AUTHOR_DIVERSITY_DECAY, position) +
      AUTHOR_DIVERSITY_FLOOR;

    scored.push({
      ...c,
      score: (c.weightedScore || 0) * multiplier,
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}
