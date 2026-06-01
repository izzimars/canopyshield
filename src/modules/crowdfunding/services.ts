import { db } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { crowdfundingRepository } from './repositories';
import { TreeContributionEntity, FinalizeTreeContributionResponse, UserContributionsResponse, SchoolContributionsResponse } from './entities';
import { ConflictException, BadException, NotFoundException } from '../../shared/errors';
import { badgeService } from '../engagement/badgeService';
import { schoolRepository } from '../schools/repositories';
import { treeRepository } from '../tree/repository';
import crowdfundingQueries from './query';

export interface ProcessContributionInput {
  userId: string;
  schoolId: string;
  amount: number;
  idempotencyKey: string;
}

export class CrowdfundingService {

  async createPendingContribution(data: {
  userId: string;
  schoolId: string;
  amount: number;
  idempotencyKey: string;
  paymentReference: string;
}) {
  // Check for duplicate idempotency key
  const existing = await crowdfundingRepository.findContributionByIdempotencyKey(data.idempotencyKey);
  if (existing) throw new ConflictException('Idempotency key already used');

  const remaining_amount = data.amount % env.TREE_PRICE;
  console.log(env.TREE_PRICE, remaining_amount, Number(env.TREE_PRICE), '------------');
  return await crowdfundingRepository.insertContribution(
    data.userId,
    data.schoolId,
    data.amount,
    remaining_amount,
    data.idempotencyKey,
    data.paymentReference,
  );
}

  /**
   * Process a tree contribution in a transaction
   * - Insert contribution record
   * - Update user stats
   * - Update school balance
   * - Plant trees if balance >= TREE_PRICE
   * - Award badges
   */
  // async processTreeContribution(input: ProcessContributionInput): Promise<TreeContributionResponse | ConflictException | NotFoundException> {
  //   logger.info('crowdfunding::services::processTreeContribution', { userId: input.userId, schoolId: input.schoolId, amount: input.amount, idempotencyKey: input.idempotencyKey });

  //   const school = await schoolRepository.findById(input.schoolId);
  //   if (school instanceof NotFoundException) {
  //     return new NotFoundException('School not found');
  //   }

  //     // Check for duplicate idempotency key
  //   const existingContribution = await crowdfundingRepository.findContributionByIdempotencyKey(input.idempotencyKey);
  //   if (existingContribution) {
  //     logger.warn('Duplicate contribution attempt detected', { idempotencyKey: input.idempotencyKey });
  //     return new ConflictException('Contribution with this idempotency key already exists');
  //   }

  //   const remaining_amount = input.amount % TREE_PRICE;
  //   return await db.transaction(async (trx) => {
  //   // 1. Insert single contribution (full amount, amount_remaining = amount)
  //     const contribution = await crowdfundingRepository.insertContribution(input.userId, input.schoolId,
  //       input.amount, remaining_amount, input.idempotencyKey, 'pending', trx);
    
  //   // 2. Update school balance
  //   await crowdfundingRepository.upsertSchoolCrowdfunding(input.schoolId, input.amount, trx);
    
  //   // 3. Plant trees while balance >= TREE_PRICE
  //   let treesPlanted = 0;
  //   let balance = await crowdfundingRepository.getSchoolBalance(input.schoolId, trx);
  //   const treePrice = Number(process.env.TREE_PRICE);
    
  //   while (balance >= treePrice) {
  //     // Create tree
  //     const tree = await TreeRepository.create({
  //       schoolId: input.schoolId,
  //       source: 'crowdfunding',
  //       plantedAt: new Date(),
  //       trx
  //     });
      
  //     // Allocate cost across pending contributions
  //     await this.allocateTreeCost(tree.id, input.schoolId, treePrice, trx);
      
  //     treesPlanted++;
  //     balance -= treePrice;
  //     await crowdfundingRepository.decrementSchoolBalance(input.schoolId, treePrice, trx);
  //   }
    
  //   // 4. Update user stats
  //   await crowdfundingRepository.updateUserStats(input.userId, input.amount, treesPlanted, trx);
    
  //   // 5. Update school tree_count and badges
  //   if (treesPlanted > 0) {
  //     await schoolRepository.incrementTreeCount(input.schoolId, treesPlanted, trx);
  //     await badgeService.awardBadgesForSchool(input.schoolId, trx);
  //   }
    
  //   return { treesPlanted, balance: balance };
  // });
  // }

  /**
   * After contribution is processed, award badges asynchronously
   */
  async awardBadgesForContribution(userId: string, schoolId: string): Promise<void> {
    try {
      logger.info('crowdfunding::services::awardBadgesForContribution', { userId, schoolId });

      // Award tree planter badge to the user
      await badgeService.awardTreePlanter(userId);

      // Check if school has reached certain tree milestones and award school-based badges
      const school = await db.oneOrNone('SELECT tree_count FROM schools WHERE id = $1', [schoolId]);
      if (!school) {
        logger.warn('School not found for badge awarding', { schoolId });
        return;
      }

      // You can add more badge logic here based on school tree count milestones
      logger.info('Badges awarded for contribution', { userId, schoolId, treeCount: school.tree_count });
    } catch (error) {
      logger.error('Failed to award badges for contribution', error);
      // Don't throw - badges are non-critical
    }
  }

  /**
   * Get user's contribution stats and history
   */
  async getUserContributions(userId: string, page: number, limit: number): Promise<UserContributionsResponse> {
    logger.info('crowdfunding::services::getUserContributions', { userId, page, limit });

    const userStats = await crowdfundingRepository.getUserStats(userId);
    const contributions = await crowdfundingRepository.getUserContributions(userId, page, limit);
    const total = await crowdfundingRepository.countUserContributions(userId);

    return {
      total_contributed: userStats?.total_contributed || 0,
      trees_funded: userStats?.trees_funded || 0,
      contributions,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * Get school's contribution stats
   */
  async getSchoolContributions(schoolId: string): Promise<SchoolContributionsResponse> {
    logger.info('crowdfunding::services::getSchoolContributions', { schoolId });

    // Verify school exists
    const school = await db.oneOrNone('SELECT id FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const schoolFunding = await crowdfundingRepository.getSchoolCrowdfunding(schoolId);
    const totalTreesFromCrowdfunding = await crowdfundingRepository.countCrowdfundingTrees(schoolId);

    return {
      current_balance: schoolFunding?.current_balance || 0,
      total_contributed: schoolFunding?.total_contributed || 0,
      total_trees_planted_via_crowdfunding: totalTreesFromCrowdfunding,
    };
  }

  async allocateTreeCost(treeId: string, contributionUuid: string, amount: number, trx: any): Promise<void> {
    logger.info('crowdfunding::services::allocateTreeCost', { treeId, contributionUuid, amount });
    const query = crowdfundingQueries.insertContributionCost;
    await trx.query(query, [treeId, contributionUuid, amount]);
}

  async finalizeContributionAfterPayment(contribution: TreeContributionEntity): Promise<FinalizeTreeContributionResponse | NotFoundException | ConflictException> {
    logger.info('crowdfunding::services::finalizeContributionAfterPayment', { contributionUuid: contribution.contribution_uuid });

  // 2. Already processed? (check if trees were already planted)
  if (contribution.processed_at) {
    return new ConflictException('Contribution already processed');
  }

  const school = await schoolRepository.findById(contribution.school_id);
  if (school instanceof NotFoundException) return new NotFoundException('School not found');

  const treePrice = Number(env.TREE_PRICE);
  const remaining_amount = contribution.amount % treePrice;

  return await db.tx(async (trx) => {
    // 3. Update school balance
    await crowdfundingRepository.upsertSchoolCrowdfunding(contribution.school_id, contribution.amount, trx);

    // 4. Plant trees while balance >= treePrice
    let treesPlanted = 0;
    let balance = await crowdfundingRepository.getSchoolBalance(contribution.school_id, trx);

    while (balance >= treePrice) {
      const tree = await treeRepository.createTreeContribution(contribution.school_id, 'crowdfunding',
        new Date(), trx);
      await this.allocateTreeCost(tree.tree_uuid, contribution.school_id, treePrice, trx);
      treesPlanted++;
      balance -= treePrice;
      await crowdfundingRepository.decrementSchoolBalance(contribution.school_id, treePrice, trx);
    }

    // 5. Update user stats
    await crowdfundingRepository.upsertUserStats(contribution.user_id, contribution.amount, treePrice, trx);

    // 6. Update school tree_count and badges
    if (treesPlanted > 0) {
      await treeRepository.incrementTreeCount(contribution.school_id, treesPlanted, trx);
      await badgeService.awardUserTreeBadges(contribution.user_id, trx);
      await badgeService.awardBadgesForSchool(contribution.school_id, trx);
    }

    // 7. Mark contribution as processed
    await crowdfundingRepository.markContributionAsProcessed(contribution.payment_reference, trx);

    return { treesPlanted, balance };
  });
}
}

export const crowdfundingService = new CrowdfundingService();
