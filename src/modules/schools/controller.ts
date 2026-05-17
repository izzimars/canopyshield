import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import { logger } from '../../config/logger';
import { NotFoundException, handleCustomError, handleCustomSuccess, UnAuthorizedException,
  InternalServerErrorException, BadException
 } from '../../shared/errors';
import { AuthRequest } from '../../shared/types/index';
import { IdParamDto, RiskHistoryQueryDto } from './dto';
import schoolRiskService, { SchoolRiskService } from './services';

export class SchoolController {
  constructor(private readonly schoolService: SchoolRiskService) {}

  async getAllSchools(req: AuthRequest, res: Response) {
    logger.info('schools::controller::getAllSchools');
    const role = req.user?.role;
    const statusFilter = role === 'admin' ? ['pending', 'approved'] : ['approved'];
    const schools = await this.schoolService.getAllSchools(statusFilter);
    return handleCustomSuccess(res, 'Schools fetched successfully', StatusCodes.OK, schools);
  }

  /**
     * POST /admin/schools
     * Create new school
  */
  async createSchool(req: AuthRequest, res: Response) {
    logger.info('schools::controller::createSchool');
    const payload = new dtos.SchoolBodyDto(req.body);

    const user = req.user;
    const status = user?.role === 'admin' ? 'approved' : 'pending';
    if (user?.role === 'admin') {
      if (!payload.lat || !payload.lng) {
        if (!payload.lat) {
          return handleCustomError(res, 'Latitude is required', StatusCodes.BAD_REQUEST, 'INVALID_COORDINATES', 'Latitude is required');
        }
        if (!payload.lng) {
          return handleCustomError(res, 'Longitude is required', StatusCodes.BAD_REQUEST, 'INVALID_COORDINATES', 'Longitude is required');
        }
      }
    }
    const result = await this.schoolService.createNewSchool(payload.name, payload.location, status,  payload.treeCount, payload.lng || undefined, payload.lat || undefined);
    return handleCustomSuccess(res, 'School created successfully', StatusCodes.CREATED, result);
  }

  async getSchoolRisk(req: Request, res: Response) {
    logger.info('schools::controller::getSchoolRisk');
    const params = new IdParamDto(req.params);

    const data = await this.schoolService.getSchoolRisk(params.id);
    if (data instanceof NotFoundException) {
      return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }
    return handleCustomSuccess(res, 'School risk fetched successfully', StatusCodes.OK, data);
  }

  async getSchoolRiskHistory(req: Request, res: Response) {
    logger.info('schools::controller::getSchoolRiskHistory');
    const params = new IdParamDto(req.params);
    const query = new RiskHistoryQueryDto(req.query as any);
    
    const data = await this.schoolService.getRiskHistory(params.id, query.days);
    if (data instanceof NotFoundException) {
      return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }
    return handleCustomSuccess(res, 'School risk history fetched successfully', StatusCodes.OK, data);
  }

  async getSchoolPrediction(req: Request, res: Response) {
    logger.info('schools::controller::getSchoolPrediction');
    const params = new IdParamDto(req.params);

    const data = await this.schoolService.getPrediction(params.id);
    if (data instanceof NotFoundException) {
      return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }
    return handleCustomSuccess(res, 'School prediction fetched successfully', StatusCodes.OK, data);
  }

  async getRiskLeaderboard(req: AuthRequest, res: Response) {
    logger.info('schools::controller::getRiskLeaderboard');

    const role = req.user?.role;
    const statusFilter = role === 'admin' ? ['pending', 'approved'] : ['approved'];
    const data = await this.schoolService.getRiskLeaderboard(statusFilter);
    if (data instanceof NotFoundException) {
      return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }
    return handleCustomSuccess(res, 'Risk leaderboard fetched successfully', StatusCodes.OK, data);
  }

  async getTreesLeaderboard(req: AuthRequest, res: Response) {
    logger.info('schools::controller::getTreesLeaderboard');

    const role = req.user?.role;
    const statusFilter = role === 'admin' ? ['pending', 'approved'] : ['approved'];
    const data = await this.schoolService.getTreesLeaderboard(statusFilter);
    if (data instanceof NotFoundException) {
      return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
    }
    return handleCustomSuccess(res, 'Tree leaderboard fetched successfully', StatusCodes.OK, data);
  }

  async getSchoolTrees(req: Request, res: Response) {
    logger.info('schools::controller::getSchoolTrees');
    const params = new IdParamDto(req.params);

      const data = await this.schoolService.getSchoolTrees(params.id);
      if (data instanceof NotFoundException) {
        return handleCustomError(res, data, StatusCodes.NOT_FOUND, 'SCHOOL_NOT_FOUND');
      }
      return handleCustomSuccess(res, 'School tree count fetched successfully', StatusCodes.OK, data);
  }
}

export const schoolController = new SchoolController(schoolRiskService);
export default schoolController;
