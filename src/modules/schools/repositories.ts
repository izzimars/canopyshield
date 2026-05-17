import { db } from '../../config/database';
import { NotFoundException } from '../../shared/errors';
import { logger } from '../../config/logger';
import schoolQueries from './query';
import { RiskSnapshotEntity, SchoolEntity } from './entities';

export interface CreateRiskSnapshotInput {
  schoolId: string;
  score: number;
  heatScore: number;
  aqiScore: number;
  rawData: Record<string, unknown>;
  rawTemp: number;
  rawHumidity: number;
  rawUv: number;
  rawAqi: number;
}

export class SchoolRepository {
  async findAll(statusfilter: Array<string>): Promise<SchoolEntity[]> {
    logger.info('schools::repository::findAll');
    return db.manyOrNone(schoolQueries.findAll, [statusfilter]);
  }

  async findById(id: string): Promise<SchoolEntity | NotFoundException> {
    logger.info('schools::repository::findById');
    const school = await db.oneOrNone(schoolQueries.findById, [id]);
    if (!school) {
      return new NotFoundException('School not found');
    }
    return school;
  }

  async findByUuId(uuid: string): Promise<SchoolEntity | null> {
    logger.info('schools::repository::findByUuId');
    const school = await db.oneOrNone(schoolQueries.findByUuId, [uuid]);
    if (!school) {
      return null;
    }
    return school;
  }

  async updateStatus(id: string, status: string): Promise<SchoolEntity | null> {
    logger.info('schools::repository::updateStatus');
    const school = await db.oneOrNone(schoolQueries.updateStatus, [id, status]);
    if (!school) {
      return null;
    }
    return school;
  }

  async updateRiskScore(id: string, score: number): Promise<void> {
    logger.info('schools::repository::updateRiskScore');
    await db.none(schoolQueries.updateRiskScore, [id, Math.round(score)]);
  }

  async updateTreeCount(id: string, count: number): Promise<void> {
    logger.info('schools::repository::updateTreeCount');
    await db.none(schoolQueries.updateTreeCount, [id, count]);
  }

  async createSchool(name: string, location: string, treeCount?: number, lng?: number, lat?: number, status?: string) {
      logger.info('admin::repository::createSchool');
      // Map to schools table columns: name, address, lat, lng, tree_count
      return await db.one(schoolQueries.createSchool, [name, location, treeCount, lng, lat, status || 'pending']);
    }
  

  async findRiskLeaderboard(statusFilter: Array<string>): Promise<Array<Pick<SchoolEntity, 'school_uuid' | 'name' | 'current_risk_score' | 'tree_count'>>> {
    logger.info('schools::repository::findRiskLeaderboard');
    return db.manyOrNone(schoolQueries.leaderboardByRisk, [statusFilter]);
  }

  async findTreesLeaderboard(statusFilter: Array<string>): Promise<Array<Pick<SchoolEntity, 'school_uuid' | 'name' | 'current_risk_score' | 'tree_count'>>> {
    logger.info('schools::repository::findTreesLeaderboard');
    return db.manyOrNone(schoolQueries.leaderboardByTrees, [statusFilter]);
  }
}

export class RiskSnapshotRepository {
  async create(data: CreateRiskSnapshotInput): Promise<RiskSnapshotEntity> {
    try {
      logger.info('schools::repository::createRiskSnapshot');
      return await db.one(schoolQueries.createRiskSnapshot, [
        data.schoolId,
        Math.round(data.score),
        Math.round(data.heatScore),
        Math.round(data.aqiScore),
        data.rawData,
        data.rawTemp,
        data.rawHumidity,
        data.rawUv,
        Math.round(data.rawAqi),
      ]);
    } catch (error) {
      logger.error('Failed to create risk snapshot', error);
      throw error;
    }
  }

  async findLatest(uuid: string, limit = 1): Promise<RiskSnapshotEntity[]> {
    logger.info('schools::repository::findLatest');
    return db.manyOrNone(schoolQueries.findLatestRisk, [uuid, limit]);
  }

  async findHistory(uuid: string, days = 7): Promise<RiskSnapshotEntity[]> {
    logger.info('schools::repository::findHistory');
    const safeDays = Number.isFinite(days) ? days : 7;
    return db.manyOrNone(schoolQueries.findRiskHistory, [uuid, safeDays]);
  }
}

export const schoolRepository = new SchoolRepository();
export const riskSnapshotRepository = new RiskSnapshotRepository();
