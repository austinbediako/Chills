export async function dropDuplicates(candidates) {
  const seen = new Set();
  return candidates.filter((c) => {
    const sid = c.submission._id.toString();
    if (seen.has(sid)) return false;
    seen.add(sid);
    return true;
  });
}
