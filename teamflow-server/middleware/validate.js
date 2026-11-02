import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed;
    return next();
  } catch (error) {
    if (error.errors) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation failed', fieldErrors));
    }
    return next(new ApiError(400, 'Invalid request data'));
  }
};

export default validate;
