export async function previouslyServedFilter(candidates, _context, seenIds = []) {
  if (!seenIds || seenIds.length === 0) return candidates;
  const seenSet = new Set(seenIds.map(String));
  return candidates.filter((c) => !seenSet.has(c.submission._id.toString()));
}
