import { db } from '../../config/database';
import { logger } from '../../config/logger';
import schoolRequestQueries from './query';
import schoolQueries from '../schools/query';

export class SchoolRequestRepository {
  async createRequest(schoolName: string, address: string | null, requesterEmail: string, lat?: number | null, lng?: number | null) {
    logger.info('schoolRequests::repository::createRequest');
    return await db.one(schoolRequestQueries.createRequest, [schoolName, address, requesterEmail, lat, lng]);
  }

  async findPending() {
    logger.info('schoolRequests::repository::findPending');
    return await db.manyOrNone(schoolRequestQueries.findPending);
  }

  async findById(id: string) {
    logger.info('schoolRequests::repository::findById');
    return await db.oneOrNone(schoolRequestQueries.findById, [id]);
  }

  async updateStatus(id: string, status: string, adminNotes?: string) {
    logger.info('schoolRequests::repository::updateStatus');
    return await db.oneOrNone(schoolRequestQueries.updateStatus, [status, adminNotes || null, id]);
  }
}

export const schoolRequestRepository = new SchoolRequestRepository();
