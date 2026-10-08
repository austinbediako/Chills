export async function selfPostFilter(candidates, context) {
  if (!context.userId) return candidates;
  return candidates.filter(
    (c) => c.submission.author?._id?.toString() !== context.userId
  );
}
