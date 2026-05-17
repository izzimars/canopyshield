import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { schoolRequestService } from './service';
import * as dtos from './dto';
import { logger } from '../../config/logger';
import { handleCustomSuccess } from '../../shared/errors';

export class SchoolRequestController {
  // async createRequest(req: Request, res: Response) {
  //   try {
  //     logger.info('schoolRequests::controller::createRequest');
  //     const payload = req.body;
  //     const validation = createRequestSchema.safeParse(payload);
  //     if (!validation.success) {
  //       return void res.status(StatusCodes.BAD_REQUEST).json(ResponseHelper.error('VALIDATION_ERROR', 'Invalid request'));
  //     }

  //     const rec = await schoolRequestService.createRequest(payload.schoolName, payload.address || null, payload.requesterEmail, payload.lat, payload.lng);
  //     return void res.status(StatusCodes.CREATED).json(ResponseHelper.success({ requestId: rec.request_uuid }));
  //   } catch (error: any) {
  //     logger.error('Create school request failed', error);
  //     return void res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseHelper.error('INTERNAL_ERROR', error?.message || 'Failed to create request'));
  //   }
  // }

  async listPending(_req: Request, res: Response) {
      logger.info('schoolRequests::controller::listPending');
      const list = await schoolRequestService.listPending();
      return handleCustomSuccess(res, 'Pending requests fetched successfully', StatusCodes.OK, list);
  }

  async updateRequest(req: Request, res: Response) {
      logger.info('schoolRequests::controller::updateRequest');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = new dtos.approveDto(req.body);

      const created = await schoolRequestService.approveRequest(id, payload.status);
      return handleCustomSuccess(res, 'Request approved successfully', StatusCodes.OK, created);
  }
}

export const schoolRequestController = new SchoolRequestController();
