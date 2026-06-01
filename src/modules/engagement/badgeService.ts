import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { pushNotificationService } from '../push/service';
import { env } from '../../config/env';

export class BadgeService {
  async awardIfNotExists(userId: string, type: string, trx?: any, url?: string) {
    const existing = await (trx || db).oneOrNone(
      'SELECT * FROM user_badges WHERE user_id = $1 AND badge_type = $2',
      [userId, type]
    );
    if (existing) return null;

    const badge = await (trx || db).one(
      'INSERT INTO user_badges (uuid, user_id, badge_type, awarded_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [uuidv4(), userId, type]
    );

    // Send push notification for certain badges
    if (['tree_planter', 'quiz_streak', 'alert_hero'].includes(type)) {
      pushNotificationService.sendToUser(userId, {
        title: 'New Badge Unlocked!',
        body: `You earned the "${type}" badge!`,
        url: url || '/profile/badges',
        eventType: 'badge-awarded',
        dedupTtlSeconds: 24 * 60 * 60,
        data: { badgeType: type },
      }).catch(console.error);
    }
    return badge;
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

  async awardUserTreeBadges(userId: string, trx: any) {
    // Get user's total trees funded
    const stats = await trx.oneOrNone(
        'SELECT total_contributed FROM user_crowdfunding_stats WHERE user_id = $1',
        [userId]
    );
    const totalContributed = stats ? Number(stats.total_contributed) : 0;
    const treesFunded = Math.floor(totalContributed / Number(env.TREE_PRICE));

    // Get all badge types where threshold <= treesFunded, ordered by threshold
    const badgeTypes = await trx.any(
        'SELECT name FROM badge_types WHERE threshold <= $1 ORDER BY threshold ASC',
        [treesFunded]
    );

    // Award each badge if not already owned
    const awarded = [];
    for (const badge of badgeTypes) {
        const result = await this.awardIfNotExists(userId, badge.name, trx, badge?.url || '/profile/badges');
        if (result) awarded.push(result);
    }
    return awarded;
}

  async awardBadgesForSchool(schoolId: string, trx: any) {
    const school = await trx.one('SELECT tree_count FROM schools WHERE school_uuid = $1', [schoolId]);
    const eligible = await trx.any(
        'SELECT name FROM school_badge_types WHERE threshold <= $1 ORDER BY threshold',
        [school.tree_count]
    );
    for (const badge of eligible) {
        await trx.none(
            `INSERT INTO school_badges (school_id, badge_type, awarded_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (school_id, badge_type) DO NOTHING`,
            [schoolId, badge.name]
        );
    }
  }
}

export const badgeService = new BadgeService();