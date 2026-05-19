import schoolRiskService from '../schools/services';
import { schoolRepository } from '../schools/repositories';
import { schoolRequestRepository } from './repositories';
import { logger } from '../../config/logger';

export class SchoolRequestService {
  async listPending() {
    logger.info('schoolRequests::services::listPending');
    return await schoolRepository.findAll(['pending']);
  }

  async approveRequest(schoolId: string, status: string) {
    logger.info('schoolRequests::services::approveRequest');
    const request = await schoolRepository.findByUuId(schoolId);
    if (!request) return null;

    const updatedRequest = await schoolRequestRepository.updateStatus(schoolId, status);

    if (!updatedRequest) return null;

    if (status !== 'approved') {
      return { request: updatedRequest, school: null, riskScore: null };
    }

    if (request.lat == null || request.lng == null) {
      logger.warn('Approved school request is missing coordinates; skipping school creation and risk computation', {
        requestId: schoolId,
      });

      return { request: updatedRequest, school: null, riskScore: null };
    }

    let riskScore: number | null = null;
    const computedRisk = await schoolRiskService.recomputeSchoolRisk(request);
    if (typeof computedRisk === 'number') {
      logger.info('Approved school request has been created')
      riskScore = computedRisk;
    }

    logger.info('Approved school request has been processed');
    return { request: updatedRequest, school: request, riskScore };
  }
}

export const schoolRequestService = new SchoolRequestService();
