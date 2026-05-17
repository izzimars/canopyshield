import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { pushNotificationService } from '../push/service';

export class BadgeService {
  async awardIfNotExists(userId: string, type: string) {
    const exists = await db.oneOrNone('SELECT badge_uuid FROM badges WHERE user_id = $1 AND type = $2', [userId, type]);
    if (exists) return null;
    const badgeUuid = uuidv4();
    await db.none('INSERT INTO badges (badge_uuid, user_id, type, awarded_at) VALUES ($1, $2, $3, now())', [badgeUuid, userId, type]);

    await pushNotificationService.sendToUser(userId, {
      title: 'New Badge!',
      body: `You earned the ${type} badge`,
      url: '/users/me',
      eventType: 'badge-awarded',
      dedupId: badgeUuid,
      dedupTtlSeconds: 24 * 60 * 60,
      data: { badgeType: type },
    });

    return { badgeUuid, type };
  }

  async awardQuizStreakIfEligible(userId: string) {
    // Check last 7 days quiz attempts streak (simplified query)
    const row = await db.oneOrNone(`
      SELECT COUNT(*)::int as consecutive
      FROM (
        SELECT date_trunc('day', attempted_at) as day
        FROM engagement_events
        WHERE user_id = $1 AND event_type = 'quiz' AND correct = true
        GROUP BY day
        ORDER BY day DESC
        LIMIT 7
      ) s
    `, [userId]);
    const consecutive = row ? Number(row.consecutive || 0) : 0;
    if (consecutive >= 7) {
      return this.awardIfNotExists(userId, 'quiz_streak');
    }
    return null;
  }

  async awardShareHeroIfEligible(userId: string) {
    // If user made >= 10 successful shares total
    const row = await db.oneOrNone('SELECT COUNT(*)::int as shares FROM engagement_events WHERE user_id = $1 AND event_type = $2', [userId, 'share']);
    const shares = row ? Number(row.shares || 0) : 0;
    if (shares >= 10) return this.awardIfNotExists(userId, 'alert_hero');
    return null;
  }

  async awardTreePlanter(userId: string) {
    return this.awardIfNotExists(userId, 'tree_planter');
  }
}

export const badgeService = new BadgeService();