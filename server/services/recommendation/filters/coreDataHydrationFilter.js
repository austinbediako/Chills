export async function coreDataHydrationFilter(candidates) {
  return candidates.filter(
    (c) => c.submission && c.submission._id && c.submission.author && c.submission.author._id
  );
}
