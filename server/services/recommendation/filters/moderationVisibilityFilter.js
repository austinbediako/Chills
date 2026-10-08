export async function moderationVisibilityFilter(candidates) {
  return candidates.filter((c) => {
    const m = c.submission.moderation;
    if (!m) return true;
    if (m.flagged === true) return false;
    if (m.grade === 'CRITICAL') return false;
    return true;
  });
}
