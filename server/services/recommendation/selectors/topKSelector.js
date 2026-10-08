export function selectTopK(candidates, page = 1, limit = 12) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 12);
  const start = (pageNum - 1) * limitNum;
  const selected = candidates.slice(start, start + limitNum);
  const totalItems = candidates.length;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  return {
    items: selected,
    page: pageNum,
    totalPages,
    totalItems,
  };
}
