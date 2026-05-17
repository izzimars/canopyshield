import { adminRepository } from './repositories';
import { badgeService } from '../engagement/badgeService';
import { authRepository } from '../authentication/repositories';
import { pushNotificationService } from '../push/service';
import { logger } from '../../config/logger';
import { db } from '../../config/database';
import schoolRiskService from '../schools/services';

export class AdminService {
  /**
   * Confirm tree request: mark as confirmed, reset school points, award badges, send notification
   */
  async confirmTree(treeRequestId: string) {
    try {
      logger.info('admin::services::confirmTree');
      // Get tree request details
      const treeRequest = await adminRepository.getTreeRequest(treeRequestId);
      if (!treeRequest) {
        throw new Error('Tree request not found');
      }

      // Transaction: lock school_points, verify tree_request still pending, reset points
      const confirmed = await db.tx(async (t) => {
        // re-check tree request status
        const tr = await t.oneOrNone('SELECT * FROM tree_requests WHERE id = $1 FOR UPDATE', [treeRequestId]);
        if (!tr) throw new Error('Tree request not found');
        if (tr.status !== 'pending') throw new Error('Tree request is not pending');

        const schoolId = tr.school_id;

        // lock school_points row
        await t.oneOrNone('SELECT * FROM school_points WHERE school_id = $1 FOR UPDATE', [schoolId]);

        // update request status
        const updated = await t.one(`UPDATE tree_requests SET status = 'confirmed', confirmed_at = now() WHERE id = $1 RETURNING *`, [treeRequestId]);

        // reset school's points
        await t.none('UPDATE school_points SET points = 0 WHERE school_id = $1', [schoolId]);

        // log confirmation event
        await t.none(`INSERT INTO engagement_events (user_id, type, school_id, points, metadata) VALUES ($1, $2, $3, $4, $5)`, [null, 'tree-confirmed', schoolId, 100, JSON.stringify({ treeRequestId })]);

        return updated;
      });

      const schoolId = confirmed.school_id;

      // Batch award badge to distinct donors for that school
      const donors = await db.manyOrNone(
        `SELECT DISTINCT user_id FROM engagement_events WHERE school_id = $1 AND type = 'donation' AND user_id IS NOT NULL`,
        [schoolId]
      );
      if (Array.isArray(donors)) {
        for (const d of donors) {
          try {
            await badgeService.awardTreePlanter(d.user_id);
          } catch (e) {
            logger.warn(`Failed to award badge to donor ${d.user_id}:`, e);
          }
        }
      }

      // Send tree-confirmed notification to school users
      await pushNotificationService.sendToSchoolUsers(schoolId, 100, {
        title: 'Tree Confirmed! 🌱',
        body: 'A tree has been planted at your school!',
        url: '/trees',
        eventType: 'tree-confirmed',
        dedupId: `tree-confirmed-${schoolId}`,
        dedupTtlSeconds: 24 * 60 * 60, // 24h dedup
      });

      // log admin action (no admin id here; controller should call insertAdminLog as needed)
      logger.info(`Tree confirmed: ${treeRequestId} for school ${schoolId}`);
      return { success: true, message: 'Tree confirmed successfully', treeRequest: confirmed };
    } catch (error) {
      logger.error('Tree confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Create new school
   */
  async createSchool(name: string, location: string, latitude: number, longitude: number) {
    try {
      logger.info('admin::services::createSchool');
      const school = await adminRepository.createSchool(name, location, latitude, longitude);
      // immediately compute initial risk and snapshot
      try {
        const score = await schoolRiskService.recomputeSchoolRisk(school);
        logger.info(`Initial risk computed for new school ${school.school_uuid}: ${score}`);
      } catch (e) {
        logger.warn('Failed to compute initial risk for new school', e);
      }

      logger.info(`School created: ${school.school_uuid} - ${name}`);
      return { success: true, school };
    } catch (error) {
      logger.error('School creation failed:', error);
      throw error;
    }
  }

  /**
   * Update school
   */
  async updateSchool(id: string, name?: string, location?: string, latitude?: number, longitude?: number) {
    try {
      logger.info('admin::services::updateSchool');
      const existing = await adminRepository.getSchoolById(id);
      if (!existing) {
        throw new Error('School not found');
      }
      const latVal = latitude !== undefined ? latitude : existing.lat;
      const lngVal = longitude !== undefined ? longitude : existing.lng;

      const school = await adminRepository.updateSchool(
        id,
        name || existing.name,
        location || existing.address,
        latVal,
        lngVal
      );
      logger.info(`School updated: ${id}`);

      // if coordinates changed, recompute risk asynchronously
      if ((latitude !== undefined && latitude !== existing.lat) || (longitude !== undefined && longitude !== existing.lng)) {
        schoolRiskService.recomputeSchoolRisk(school).catch((e) => logger.warn('Recompute risk failed after school update', e));
      }
      return { success: true, school };
    } catch (error) {
      logger.error('School update failed:', error);
      throw error;
    }
  }

  /**
   * Delete school (soft delete)
   */
  async deleteSchool(id: string) {
    try {
      logger.info('admin::services::deleteSchool');
      const school = await adminRepository.deleteSchool(id);
      logger.info(`School soft-deleted: ${id}`);
      return { success: true, message: 'School deleted', school };
    } catch (error) {
      logger.error('School deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get all schools
   */
  async getAllSchools() {
    try {
      logger.info('admin::services::getAllSchools');
      const schools = await adminRepository.getAllSchools();
      return { success: true, schools };
    } catch (error) {
      logger.error('Failed to fetch schools:', error);
      throw error;
    }
  }

  /**
   * Get school by ID
   */
  async getSchool(id: string) {
    try {
      logger.info('admin::services::getSchool');
      const school = await adminRepository.getSchoolById(id);
      if (!school) {
        throw new Error('School not found');
      }
      return { success: true, school };
    } catch (error) {
      logger.error('Failed to fetch school:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
