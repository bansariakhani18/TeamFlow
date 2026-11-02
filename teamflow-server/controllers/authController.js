import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'teamflow_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(
        new ApiError(409, 'User with this email already exists', [
          { field: 'email', message: 'Email is already registered' },
        ])
      );
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return sendSuccess(res, 201, { user: userData, token }, 'User registered successfully');
  } catch (error) {
    return next(error);
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return sendSuccess(res, 200, { user: userData, token }, 'Logged in successfully');
  } catch (error) {
    return next(error);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  try {
    return sendSuccess(res, 200, { user: req.user }, 'Current user profile retrieved');
  } catch (error) {
    return next(error);
  }
});

export default { register, login, getMe };
