import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../config/logger';
import * as dtos from './dto';
import { handleCustomError, handleCustomSuccess, NotFoundException } from '../../shared/errors';
import { AuthRequest } from '../../shared/types/index';
import { crowdfundingService } from './services';
import { paymentService } from '../payments/service';

export class CrowdfundingController {
  /**
   * POST /api/v1/payments/tree-contribution
   * Create a tree contribution
   */
  async createTreeContribution(req: AuthRequest, res: Response) {
    logger.info('crowdfunding::controller::createTreeContribution');

    const payload = new dtos.CrowdfundingDto(req.body);
    console.log('Payload:', payload);
    const user = req.user;

    if (!user) {
      return handleCustomError(res, 'User not authenticated', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const result = await paymentService.initializeContributionPayment({
      userId: user.uuid,
      schoolId: payload.schoolId,
      amount: payload.amount,
      email: user.email,
      idempotencyKey: payload.idempotencyKey
    });

    return handleCustomSuccess(res, 'Tree contribution created successfully', StatusCodes.CREATED, result);
  }

  /**
   * GET /api/v1/users/me/contributions
   * Get user's contribution stats and history
   */
  async getUserContributions(req: AuthRequest, res: Response) {
    logger.info('crowdfunding::controller::getUserContributions');

    try {
      const userId = req.user?.id;
      if (!userId) {
        return handleCustomError(res, 'User not authenticated', StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
      }

      // Validate query params
      const validationResult = PaginationSchema.safeParse(req.query);
      if (!validationResult.success) {
        logger.warn('crowdfunding::controller::getUserContributions - validation failed', { errors: validationResult.error.errors });
        return handleCustomError(res, 'Invalid query parameters', StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR');
      }

      const { page, limit } = validationResult.data;

      const result = await crowdfundingService.getUserContributions(userId, page, limit);
      return handleCustomSuccess(res, 'User contributions fetched successfully', StatusCodes.OK, result);
    } catch (error) {
      logger.error('crowdfunding::controller::getUserContributions - unexpected error', error);
      return handleCustomError(res, 'Internal server error', StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
    }
  }

  /**
   * GET /api/v1/schools/:schoolId/contributions
   * Get school's contribution stats
   */
  async getSchoolContributions(req: AuthRequest, res: Response) {
    logger.info('crowdfunding::controller::getSchoolContributions');

    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        return handleCustomError(res, 'schoolId is required', StatusCodes.BAD_REQUEST, 'MISSING_PARAM');
      }

      try {
        const result = await crowdfundingService.getSchoolContributions(schoolId);
        return handleCustomSuccess(res, 'School contributions fetched successfully', StatusCodes.OK, result);
      } catch (error) {
        if (error instanceof NotFoundException) {
          logger.warn('crowdfunding::controller::getSchoolContributions - school not found', { schoolId });
          return handleCustomError(res, error.message, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
        }
        throw error;
      }
    } catch (error) {
      logger.error('crowdfunding::controller::getSchoolContributions - unexpected error', error);
      return handleCustomError(res, 'Internal server error', StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
    }
  }
}

export const crowdfundingController = new CrowdfundingController();
