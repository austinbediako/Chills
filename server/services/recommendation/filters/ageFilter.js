import { MAX_POST_AGE_DAYS } from '../params.js';

const MAX_AGE_MS = MAX_POST_AGE_DAYS * 24 * 60 * 60 * 1000;

export async function ageFilter(candidates) {
  const now = Date.now();
  return candidates.filter(
    (c) => now - new Date(c.submission.createdAt).getTime() <= MAX_AGE_MS
  );
}
