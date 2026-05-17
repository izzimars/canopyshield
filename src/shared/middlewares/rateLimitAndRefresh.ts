import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis.js';
import { handleCustomError } from '../errors/index';
import { logger } from '../../config/logger';

/**
 * Rate limiting middleware using Redis sliding window
 * @param maxAttempts - max attempts allowed
 * @param windowMs - time window in milliseconds
 * @param keyGen - function to generate rate limit key (e.g., IP+email)
 */
export const rateLimit = (maxAttempts: number, windowMs: number, keyGen?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('shared::middleware::rateLimit');
      const key = keyGen ? keyGen(req) : `ratelimit:${req.ip}:${req.path}`;
      const attempts = await redis.incr(key);

      if (attempts === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (attempts > maxAttempts) {
        return handleCustomError(res, 'Too Many Requests', 429, `Rate limit exceeded. Try again later.`);
      }

      return next();
    } catch (error) {
      // On Redis failure, allow request to proceed but log
      console.error('Rate limit check failed:', error);
      return next();
    }
  };
};
