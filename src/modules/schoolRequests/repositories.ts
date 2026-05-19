import { db } from '../../config/database';
import { logger } from '../../config/logger';
import schoolRequestQueries from './query';
import schoolQueries from '../schools/query';

export class SchoolRequestRepository {
  async findPending() {
    logger.info('schoolRequests::repository::findPending');
    return await db.manyOrNone(schoolRequestQueries.findPending);
  }

  async findById(id: string) {
    logger.info('schoolRequests::repository::findById');
    return await db.oneOrNone(schoolRequestQueries.findById, [id]);
  }

  async updateStatus(id: string, status: string) {
    logger.info('schoolRequests::repository::updateStatus');
    return await db.oneOrNone(schoolQueries.updateStatus, [id, status]);
  }
}

export const schoolRequestRepository = new SchoolRequestRepository();
