import { ACTION_WEIGHTS } from '../params.js';

export async function weightedScore(candidates) {
  return candidates.map((c) => {
    const s = c.phoenixScores || {};
    let weighted = 0;

    for (const [action, weight] of Object.entries(ACTION_WEIGHTS)) {
      const value = s[action] ?? 0;
      weighted += value * weight;
    }

    return {
      ...c,
      weightedScore: Math.max(0, weighted),
    };
  });
}
