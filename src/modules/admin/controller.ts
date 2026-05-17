import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../../shared/types/index';
import ResponseHelper from '../../shared/utils/response';
import { adminService } from './service';
import { adminRepository } from './repositories';
import { adminStatsService } from './statsService';
import { logger } from '../../config/logger';
import { confirmTreeSchema, createSchoolSchema, updateSchoolSchema } from './dto';

export class AdminController {
  /**
   * POST /admin/trees/confirm
   * Confirm tree planting request
   */
  async confirmTree(req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::confirmTree');
      const { treeRequestId } = req.body;

      // Validate input
      const validation = confirmTreeSchema.safeParse({ treeRequestId });
      if (!validation.success) {
        return void res.status(StatusCodes.BAD_REQUEST).json(
          ResponseHelper.error('VALIDATION_ERROR', 'Invalid tree request ID')
        );
      }

      const result = await adminService.confirmTree(treeRequestId);
      // log admin action
      try {
        const adminId = req.user?.id || null;
        await adminRepository.insertAdminLog(adminId, 'confirm_tree', 'tree_request', treeRequestId, { by: adminId });
      } catch (e) {
        logger.warn('Failed to insert admin log for tree confirmation', e);
      }
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(result));
    } catch (error: any) {
      logger.error('Tree confirmation error:', error);
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', error?.message || 'Tree confirmation failed')
      );
    }
  }

  /**
   * GET /admin/trees/pending
   */
  async getPendingTrees(_req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::getPendingTrees');
      const list = await adminRepository.listPendingTreeRequests();
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(list));
    } catch (error: any) {
      logger.error('Failed to list pending trees:', error);
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseHelper.error('INTERNAL_ERROR', 'Failed to fetch pending tree requests'));
    }
  }

  /**
   * GET /admin/stats
   */
  async getStats(_req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::getStats');
      const stats = await adminStatsService.getStats();
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(stats));
    } catch (error: any) {
      logger.error('Failed to fetch admin stats:', error);
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseHelper.error('INTERNAL_ERROR', 'Failed to fetch admin stats'));
    }
  }

  /**
   * POST /admin/schools
   * Create new school
   */
  async createSchool(req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::createSchool');
      const payload = req.body;

      // Validate input
      const validation = createSchoolSchema.safeParse(payload);
      if (!validation.success) {
        return void res.status(StatusCodes.BAD_REQUEST).json(
          ResponseHelper.error('VALIDATION_ERROR', 'Invalid school data')
        );
      }

      const result = await adminService.createSchool(payload.name, payload.location, payload.latitude, payload.longitude);
      return void res.status(StatusCodes.CREATED).json(ResponseHelper.success(result.school));
    } catch (error: any) {
      logger.error('School creation error:', error);
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', error?.message || 'School creation failed')
      );
    }
  }

  /**
   * GET /admin/schools
   * Get all schools
   */
  async getAllSchools(_req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::getAllSchools');
      const result = await adminService.getAllSchools();
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(result.schools));
    } catch (error: any) {
      logger.error('Get schools error:', error);
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', 'Failed to fetch schools')
      );
    }
  }

  /**
   * GET /admin/schools/:id
   * Get school by ID
   */
  async getSchool(req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::getSchool');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.getSchool(id);
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(result.school));
    } catch (error: any) {
      logger.error('Get school error:', error);
      if (error?.message === 'School not found') {
        return void res.status(StatusCodes.NOT_FOUND).json(
          ResponseHelper.error('NOT_FOUND', 'School not found')
        );
      }
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', error?.message || 'Failed to fetch school')
      );
    }
  }

  /**
   * PUT /admin/schools/:id
   * Update school
   */
  async updateSchool(req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::updateSchool');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = req.body;

      // Validate input
      const validation = updateSchoolSchema.safeParse(payload);
      if (!validation.success) {
        return void res.status(StatusCodes.BAD_REQUEST).json(
          ResponseHelper.error('VALIDATION_ERROR', 'Invalid school data')
        );
      }

      const result = await adminService.updateSchool(
        id,
        payload.name,
        payload.location,
        payload.latitude,
        payload.longitude
      );
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(result.school));
    } catch (error: any) {
      logger.error('School update error:', error);
      if (error?.message === 'School not found') {
        return void res.status(StatusCodes.NOT_FOUND).json(
          ResponseHelper.error('NOT_FOUND', 'School not found')
        );
      }
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', error?.message || 'School update failed')
      );
    }
  }

  /**
   * DELETE /admin/schools/:id
   * Delete school (soft delete)
   */
  async deleteSchool(req: AuthRequest, res: Response) {
    try {
      logger.info('admin::controller::deleteSchool');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await adminService.deleteSchool(id);
      return void res.status(StatusCodes.OK).json(ResponseHelper.success(result));
    } catch (error: any) {
      logger.error('School deletion error:', error);
      if (error?.message === 'School not found') {
        return void res.status(StatusCodes.NOT_FOUND).json(
          ResponseHelper.error('NOT_FOUND', 'School not found')
        );
      }
      return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseHelper.error('INTERNAL_ERROR', error?.message || 'School deletion failed')
      );
    }
  }
}

export const adminController = new AdminController();
export default adminController;
