import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  handler(req, res, next) {
    next(new ApiError(429, 'Too many requests, please try again later'));
  },
});

export default limiter;
