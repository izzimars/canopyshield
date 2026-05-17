import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';
import { StatusCodes } from 'http-status-codes';
import { handleCustomError } from '../errors/index';
import { schoolRepository } from '../../modules/schools/repositories';
import _ from 'lodash';
import { logger } from '../../config/logger';

export default function checkSchoolNotPendingForUser() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    logger.info('schools::middleware::checkSchoolNotPendingForUser');
    const schoolId = req.params.id;
    if (!schoolId || typeof schoolId !== 'string') {
      return handleCustomError(res, 'School ID is required', StatusCodes.BAD_REQUEST, 'SCHOOL_ID_REQUIRED');
    }

    const school = await schoolRepository.findByUuId(schoolId); // note: use consistent naming
    if (!school) {
      return handleCustomError(res, 'School not found', StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }

    const role = req.user?.role;
    if (school.status === 'pending' && role !== 'admin') {
      logger.info('schools::middleware::checkSchoolNotPendingForUser');
      return handleCustomError(res, 'School is pending approval', StatusCodes.FORBIDDEN, 'SCHOOL_PENDING_APPROVAL');
    }

    return next();
  };
}