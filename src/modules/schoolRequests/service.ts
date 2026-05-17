import { schoolRepository } from '../schools/repositories';
import { logger } from '../../config/logger';

export class SchoolRequestService {
  async listPending() {
    logger.info('schoolRequests::services::listPending');
    return await schoolRepository.findAll(['pending']);
  }

  async approveRequest(schoolId: string, status: string) {
    logger.info('schoolRequests::services::approveRequest');
    const school = await schoolRepository.findByUuId(schoolId);
    if (!school) return null;

    const updatedSchool = await schoolRepository.updateStatus(schoolId, status);

    return updatedSchool;
  }
}

export const schoolRequestService = new SchoolRequestService();
