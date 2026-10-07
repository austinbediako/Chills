import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/Category.js';
import Submission from '../models/Submission.js';

// @desc    Get all categories with counts
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });
  
  // Aggregate post counts per category for PUBLISHED submissions
  const counts = await Submission.aggregate([
    { $match: { status: 'PUBLISHED' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const countMap = {};
  counts.forEach(c => {
    if (c._id) countMap[c._id.toString()] = c.count;
  });
  
  const result = categories.map(cat => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    count: countMap[cat._id.toString()] || 0
  }));
  
  res.json(result);
});