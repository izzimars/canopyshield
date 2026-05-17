import { db } from '../../config/database';
import { logger } from '../../config/logger';
import adminQueries from './query';

export class AdminRepository {
  /**
   * Get tree request by ID
   */
  async getTreeRequest(id: string) {
    logger.info('admin::repository::getTreeRequest');
    return await db.oneOrNone(adminQueries.getTreeRequestById, [id]);
  }

  /**
   * Confirm tree request (update status to confirmed)
   */
  async confirmTreeRequest(id: string) {
    logger.info('admin::repository::confirmTreeRequest');
    return await db.one(adminQueries.updateTreeRequestStatus, ['confirmed', id]);
  }

  /**
   * Reset school points to 0 after tree confirmation
   */
  async resetSchoolPoints(schoolId: string) {
    logger.info('admin::repository::resetSchoolPoints');
    return await db.oneOrNone(adminQueries.resetSchoolPoints, [schoolId]);
  }

  /**
   * Create new school
   */
  async createSchool(name: string, location: string, latitude: number, longitude: number) {
    logger.info('admin::repository::createSchool');
    // Map to schools table columns: name, address, lat, lng, tree_count
    return await db.one(adminQueries.createSchool, [name, location, latitude, longitude, 0]);
  }

  /**
   * Update school
   */
  async updateSchool(id: string, name: string, location: string, latitude: number, longitude: number) {
    logger.info('admin::repository::updateSchool');
    // updateSchool expects (name, address, lat, lng, tree_count?, school_uuid)
    return await db.one(adminQueries.updateSchool, [name, location, latitude, longitude, undefined, id]);
  }

  /**
   * Soft delete school
   */
  async deleteSchool(id: string) {
    logger.info('admin::repository::deleteSchool');
    return await db.one(adminQueries.softDeleteSchool, [id]);
  }

  /**
   * Get all active schools
   */
  async getAllSchools() {
    logger.info('admin::repository::getAllSchools');
    return await db.manyOrNone(adminQueries.getAllSchools);
  }

  /**
   * Get school by ID
   */
  async getSchoolById(id: string) {
    logger.info('admin::repository::getSchoolById');
    return await db.oneOrNone(adminQueries.getSchoolById, [id]);
  }
  
  async listPendingTreeRequests() {
    logger.info('admin::repository::listPendingTreeRequests');
    return await db.manyOrNone(adminQueries.listPendingTreeRequests);
  }

  async insertAdminLog(adminUserId: string, action: string, targetType: string, targetId: string | null, details: any) {
    logger.info('admin::repository::insertAdminLog');
    return await db.one(adminQueries.insertAdminLog, [adminUserId, action, targetType, targetId, details]);
  }
}

export const adminRepository = new AdminRepository();
export default adminRepository;
