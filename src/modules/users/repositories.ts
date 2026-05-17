import { db } from '../../config/database';
import usersQueries from './query';
import { UserProfile } from '../../shared/types';
import { logger } from '../../config/logger';

export class UsersRepository {
  async getFullProfile(userUuid: string): Promise<UserProfile | null> {
    logger.info('users::repository::getFullProfile');
    const res = await db.oneOrNone(usersQueries.getUserBasic, [userUuid]);
    if (!res) return null;

    const badgeRows = await db.manyOrNone(usersQueries.getBadges, [userUuid]);
    const alertRow = await db.oneOrNone(usersQueries.getAlertPreferences, [userUuid]);

    const badges: Array<{ type: string; awarded_at: string }> = (badgeRows || []).map(b => ({
      type: b.type,
      awarded_at: b.awarded_at
    }));

    return {
      id: res.user_uuid,
      email: res.email,
      points: Number(res.points || 0),
      role: res.role,
      schoolId: res.school_id,
      badges,
      alertPreferences: alertRow || { risk_threshold: 60, channels: ['email'], frequency: 'immediate' }
    };
  }

  async updateAlertPreferences(userUuid: string, riskThreshold: number | undefined, channels: string[] | undefined, frequency: string | undefined) {
    logger.info('users::repository::updateAlertPreferences');
    const rt = riskThreshold ?? 60;
    const ch = channels ?? ['email'];
    const fq = frequency ?? 'immediate';
    await db.none(usersQueries.updateAlertPreferences, [userUuid, rt, ch, fq]);
    return { risk_threshold: rt, channels: ch, frequency: fq };
  }
}

export const usersRepository = new UsersRepository();