import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// @desc    Search registered users by name or email
// @route   GET /api/users?search=
// @access  Private
export const searchUsers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;

  if (!search || search.trim().length < 2) {
    return next(new ApiError(400, 'Search query must be at least 2 characters long'));
  }

  const queryRegex = { $regex: search.trim(), $options: 'i' };

  const users = await User.find({
    $or: [{ name: queryRegex }, { email: queryRegex }],
  })
    .select('_id name email')
    .limit(10)
    .lean();

  return sendSuccess(res, 200, users, 'Users retrieved successfully');
});

export default { searchUsers };
