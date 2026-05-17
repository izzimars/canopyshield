import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import pushQueries from './query';
import { logger } from '../../config/logger';

export interface PushSubscriptionRecord {
  subscription_uuid: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export class PushRepository {
  async upsertSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscriptionRecord> {
    logger.info('push::repository::upsertSubscription');
    return db.one(pushQueries.upsertSubscription, [
      uuidv4(),
      userId,
      endpoint,
      p256dh,
      auth,
    ]);
  }

  async findByUser(userId: string): Promise<PushSubscriptionRecord[]> {
    logger.info('push::repository::findByUser');
    return db.manyOrNone(pushQueries.findByUser, [userId]);
  }

  async findByUserAndEndpoint(userId: string, endpoint: string): Promise<PushSubscriptionRecord | null> {
    logger.info('push::repository::findByUserAndEndpoint');
    return db.oneOrNone(pushQueries.findByUserAndEndpoint, [userId, endpoint]);
  }

  async deleteByUserAndEndpoint(userId: string, endpoint: string): Promise<void> {
    logger.info('push::repository::deleteByUserAndEndpoint');
    await db.none(pushQueries.deleteByUserAndEndpoint, [userId, endpoint]);
  }

  async deleteByUser(userId: string): Promise<void> {
    logger.info('push::repository::deleteByUser');
    await db.none(pushQueries.deleteByUser, [userId]);
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    logger.info('push::repository::deleteByEndpoint');
    await db.none(pushQueries.deleteByEndpoint, [endpoint]);
  }

  async listVerifiedUserIds(): Promise<string[]> {
    logger.info('push::repository::listVerifiedUserIds');
    const rows = await db.manyOrNone(pushQueries.listVerifiedUserIds);
    return rows.map((row) => row.user_uuid);
  }

  async listSchoolRecipients(schoolId: string, riskScore: number): Promise<string[]> {
    logger.info('push::repository::listSchoolRecipients');
    const rows = await db.manyOrNone(pushQueries.listSchoolRecipients, [schoolId, riskScore]);
    return rows.map((row) => row.user_uuid);
  }
}

export const pushRepository = new PushRepository();
