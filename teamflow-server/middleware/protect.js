import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'teamflow_secret_key');
    const userId = decoded.id || decoded._id;
    let user = null;

    if (userId) {
      try {
        user = await User.findById(userId).select('-password');
      } catch (err) {
        // DB error or test fallback
      }
    }

    if (!user) {
      return next(new ApiError(401, 'Not authorized, user not found'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(error);
    }
    return next(new ApiError(401, 'Not authorized, token verification failed'));
  }
};

export default protect;
