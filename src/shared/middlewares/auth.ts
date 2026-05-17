import { Response, NextFunction } from 'express';
import { handleCustomError, NotFoundException } from '../errors/index';
import { AuthRequest } from '../types/index.js';
import { StatusCodes } from 'http-status-codes';
import { authRepository } from '../../modules/authentication/repositories';
import hashingService from '../../services/hashing/hashing.service';
import _ from 'lodash';
import { SignedData } from '../interfaces/index.js';
import { logger } from '../../config/logger';

/**
 * Middleware to verify JWT access token and attach user to request
 */
export default function AuthMiddleware(tokenType: string) {
  // Return an actual Express middleware
  return async function (req: AuthRequest, res: Response, next: NextFunction) {
    logger.info(`authentication::middleware::AuthMiddleware(${tokenType})`);
    const token = (req?.headers.authorization as string)?.split(' ')[1];

    if (!token) {
      logger.error(`authentication::middleware::AuthMiddleware - No token provided in Authorization header`);
      return handleCustomError(res, 'Unauthorized', StatusCodes.UNAUTHORIZED, 'Token not found');
    }

    const decoded = hashingService.verify(token) as SignedData;

    if (!decoded || !decoded.id || decoded.type !== tokenType) {
      logger.error(`authentication::middleware::AuthMiddleware - Invalid token: ${token}`);
      return handleCustomError(res, 'Unauthorized', StatusCodes.UNAUTHORIZED, 'Invalid token');
    }

    const user = await authRepository.findByUuid(decoded.user_id);

    if (user instanceof NotFoundException) {
      logger.error(`authentication::middleware::AuthMiddleware - User not found for ID: ${decoded.user_id}`);
      return handleCustomError(res, 'Unauthorized', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    if (!user) {
      logger.error(`authentication::middleware::AuthMiddleware - User not found for ID: ${decoded.user_id}`);
      return handleCustomError(res, 'Unauthorized', StatusCodes.UNAUTHORIZED, 'User not found');
    }

    (req as any).claim = {
      ...user,
      ..._.omit(user, ['password'])
    };

    req.user = {
      id: user.user_uuid,
      uuid: user.user_uuid,
      user_uuid: user.user_uuid,
      email: user.email,
      role: user.role,
      jti: String(decoded.id),
      is_verified: user.is_verified,
    };
    logger.info(`authentication::middleware::AuthMiddleware - User authenticated: ${req.user.id}`);
    return next();
  };
}

export const requireAuth = AuthMiddleware('access');

/**
 * Middleware to check user role
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    logger.info('authentication::middleware::requireRole');
    if (!req.user) {
      return handleCustomError(res, 'Unauthorized', StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return handleCustomError(res, 'Forbidden', StatusCodes.FORBIDDEN, 'Insufficient permissions');
    }
    return next();
  };
};
