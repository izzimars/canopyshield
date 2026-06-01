import { db } from '../../config/database';
import { logger } from '../../config/logger';
import crowdfundingQueries from './query';
import {
  TreeContributionEntity,
  SchoolCrowdfundingEntity,
  UserCrowdfundingStatsEntity,
} from './entities';
import { ConflictException, NotFoundException } from '../../shared/errors';

export class CrowdfundingRepository {
  /**
   * Insert a tree contribution
   */
  async insertContribution(
    userId: string,
    schoolId: string,
    amount: number,
    amount_remaining: number,
    idempotencyKey: string,
    paymentReference: string,
  ): Promise<TreeContributionEntity> {
    logger.info('crowdfunding::repository::insertContribution');
    return await db.one(crowdfundingQueries.insertContribution, [userId, schoolId, amount,
      amount_remaining, idempotencyKey, paymentReference]);
  }

  /**
   * Find contribution by idempotency key
   */
  async findContributionByIdempotencyKey(
    idempotencyKey: string
  ): Promise<TreeContributionEntity | null> {
    logger.info('crowdfunding::repository::findContributionByIdempotencyKey', { idempotencyKey });
    return await db.oneOrNone(crowdfundingQueries.findContributionByIdempotencyKey, [idempotencyKey]);
  }

  /**
   * Get user contributions with pagination
   */
  async getUserContributions(
    userId: string,
    page: number,
    limit: number
  ): Promise<TreeContributionEntity[]> {
    logger.info('crowdfunding::repository::getUserContributions', { userId, page, limit });
    const offset = (page - 1) * limit;
    return await db.manyOrNone(crowdfundingQueries.getUserContributions, [userId, limit, offset]);
  }

  /**
   * Count user contributions
   */
  async countUserContributions(userId: string): Promise<number> {
    logger.info('crowdfunding::repository::countUserContributions', { userId });
    const result = await db.oneOrNone(crowdfundingQueries.countUserContributions, [userId]);
    return result?.total || 0;
  }

  /**
   * Get school contributions with pagination
   */
  async getSchoolContributions(
    schoolId: string,
    page: number,
    limit: number
  ): Promise<TreeContributionEntity[]> {
    logger.info('crowdfunding::repository::getSchoolContributions', { schoolId, page, limit });
    const offset = (page - 1) * limit;
    return await db.manyOrNone(crowdfundingQueries.getSchoolContributions, [schoolId, limit, offset]);
  }

  /**
   * Count school contributions
   */
  async countSchoolContributions(schoolId: string): Promise<number> {
    logger.info('crowdfunding::repository::countSchoolContributions', { schoolId });
    const result = await db.oneOrNone(crowdfundingQueries.countSchoolContributions, [schoolId]);
    return result?.total || 0;
  }

  /**
   * Upsert school crowdfunding record
   */
  async upsertSchoolCrowdfunding(
    schoolId: string,
    amountToAdd: number,
    trx: any
  ): Promise<SchoolCrowdfundingEntity> {
    logger.info('crowdfunding::repository::upsertSchoolCrowdfunding');
    return await trx.one(crowdfundingQueries.upsertSchoolCrowdfunding, [ schoolId, amountToAdd ]);
  }

  async getSchoolBalance(
    schoolId: string,
    trx: any
  ): Promise<number> {
    logger.info('crowdfunding::repository::getSchoolBalance', { schoolId });
    const result = await trx.oneOrNone(crowdfundingQueries.getSchoolBalance, [schoolId]);
    return result?.balance || 0;
  }

  /**
   * Get school crowdfunding with row-level lock (for UPDATE)
   */
  async getSchoolCrowdfundingForUpdate(schoolId: string): Promise<SchoolCrowdfundingEntity | null> {
    logger.info('crowdfunding::repository::getSchoolCrowdfundingForUpdate', { schoolId });
    return await db.oneOrNone(crowdfundingQueries.getSchoolCrowdfunding, [schoolId]);
  }

  /**
   * Get school crowdfunding without lock
   */
  async getSchoolCrowdfunding(schoolId: string): Promise<SchoolCrowdfundingEntity | null> {
    logger.info('crowdfunding::repository::getSchoolCrowdfunding', { schoolId });
    return await db.oneOrNone(crowdfundingQueries.getSchoolCrowdfundingWithoutLock, [schoolId]);
  }

  /**
   * Update school crowdfunding balance
   */
  async updateSchoolCrowdfundingBalance(
    schoolId: string,
    newBalance: number
  ): Promise<SchoolCrowdfundingEntity> {
    logger.info('crowdfunding::repository::updateSchoolCrowdfundingBalance', {
      schoolId,
      newBalance,
    });
    return await db.one(crowdfundingQueries.updateSchoolCrowdfundingBalance, [schoolId, newBalance]);
  }

  /**
   * Upsert user crowdfunding stats
   */
  async upsertUserStats(userId: string, amountToAdd: number, treePrice: number, trx: any): Promise<UserCrowdfundingStatsEntity> {
    logger.info('crowdfunding::repository::upsertUserStats', {userId, amountToAdd, treePrice});
    return await trx.one(crowdfundingQueries.upsertUserStats, [userId, amountToAdd,
      Math.round((amountToAdd / treePrice) * 100) / 100, treePrice]);
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<UserCrowdfundingStatsEntity | null> {
    logger.info('crowdfunding::repository::getUserStats', { userId });
    return await db.oneOrNone(crowdfundingQueries.getUserStats, [userId]);
  }

  /**
   * Insert a new tree (crowdfunding source)
   */
  async insertTree(schoolId: string): Promise<any> {
    logger.info('crowdfunding::repository::insertTree', { schoolId });
    return await db.one(crowdfundingQueries.insertTree, [schoolId]);
  }

  /**
   * Count crowdfunding trees for a school
   */
  async countCrowdfundingTrees(schoolId: string): Promise<number> {
    logger.info('crowdfunding::repository::countCrowdfundingTrees', { schoolId });
    const result = await db.oneOrNone(crowdfundingQueries.countCrowdfundingTrees, [schoolId]);
    return result?.total || 0;
  }

  async updateSchoolTreeCount(schoolId: string, newCount: number): Promise<void> {
    logger.info('crowdfunding::repository::updateSchoolTreeCount', { schoolId, newCount });
    await db.none(crowdfundingQueries.updateSchoolTreeCount, [schoolId, newCount]);
  }

  async findByPaymentReference(paymentReference: string): Promise<TreeContributionEntity | null> {
    logger.info('crowdfunding::repository::findByPaymentReference', { paymentReference });
    return await db.oneOrNone(crowdfundingQueries.findByPaymentReference, [paymentReference]);
  }

  async updateContributionStatus(paymentReference: string, status: string): Promise<void> {
    logger.info('crowdfunding::repository::updateContributionStatus', { paymentReference, status });
    await db.none(crowdfundingQueries.updateContributionStatus, [paymentReference, status]);
  }

  async allocateTreeCost(treeId: string, schoolId: string, amount: number, trx: any): Promise<void> {
    logger.info('crowdfunding::repository::allocateTreeCost', { treeId, schoolId, amount });
    const query = crowdfundingQueries.insertContributionCost;
    await trx.query(query, [treeId, schoolId, amount]);
  }

  async decrementSchoolBalance(schoolId: string, amount: number, trx: any): Promise<void> {
    logger.info('crowdfunding::repository::decrementSchoolBalance', { schoolId, amount });
    const currentBalance = await this.getSchoolBalance(schoolId, trx);
    const newBalance = currentBalance - amount;
    await this.updateSchoolCrowdfundingBalance(schoolId, newBalance);
  }

  async markContributionAsProcessed(paymentReference: string, trx: any): Promise<void> {
    logger.info('crowdfunding::repository::markContributionAsProcessed', { paymentReference });
    const query = crowdfundingQueries.updateContributionStatus;
    await trx.query(query, [paymentReference, 'completed']);
  }
}

export const crowdfundingRepository = new CrowdfundingRepository();
