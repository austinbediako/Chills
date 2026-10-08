import { runRecommendationPipeline } from './pipeline.js';

export async function getForYouFeed({ user, page = 1, limit = 12, seenIds = [] }) {
  return runRecommendationPipeline({ user, page, limit, seenIds });
}

export { runRecommendationPipeline };
