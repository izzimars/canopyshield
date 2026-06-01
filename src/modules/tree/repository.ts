
import { logger } from '../../config/logger';
import { TreeQueries } from './query';
import {
  TreeEntity,
} from './entities';

export class TreeRepository {
  async createTreeContribution(schoolId: string, source: string, plantedAt: Date, trx: any): Promise<TreeEntity> {
    logger.info('tree::repository::createTreeContribution');
    return await trx.one(TreeQueries.insertTree, [schoolId, source, plantedAt]);
  }

  async incrementTreeCount(schoolId: string, count: number, trx: any): Promise<void> {
    logger.info('tree::repository::incrementTreeCount', { schoolId, count });
    await trx.none(TreeQueries.incrementTreeCount, [count, schoolId]);
  }
}

export const treeRepository = new TreeRepository();
