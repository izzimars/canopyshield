import { db } from '../../config/database';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

export class AdminStatsService {
  private cacheKey = 'admin:stats';

  async computeStats() {
    // Run queries in parallel
    const totalUsersQ = db.one('SELECT COUNT(*)::int as count FROM users WHERE deleted_at IS NULL');
    const dauQ = db.manyOrNone(`
      SELECT date_trunc('day', created_at) as day, COUNT(DISTINCT user_id)::int as users
      FROM engagement_events
      WHERE created_at >= now() - interval '7 days'
      GROUP BY day
      ORDER BY day DESC
    `);
    const engagementQ = db.manyOrNone(`
      SELECT type, COUNT(*)::int as count
      FROM engagement_events
      WHERE created_at >= now() - interval '30 days'
      GROUP BY type
    `);
    const pointPoolsQ = db.manyOrNone(`
      SELECT s.school_uuid, s.name, COALESCE(sp.points,0) as points
      FROM schools s
      LEFT JOIN school_points sp ON sp.school_id = s.school_uuid
      WHERE s.deleted_at IS NULL
      ORDER BY s.name
    `);
    const totalTreesQ = db.one('SELECT COUNT(*)::int as count FROM tree_requests WHERE status = \'' + 'confirmed' + '\'');
    const lastPlantDateQ = db.oneOrNone('SELECT MAX(confirmed_at) as last_plant FROM tree_requests WHERE status = $1', ['confirmed']);

    try {
      const [totalUsers, dau, engagement, pools, totalTrees, lastPlant] = await Promise.all([
        totalUsersQ,
        dauQ,
        engagementQ,
        pointPoolsQ,
        totalTreesQ,
        lastPlantDateQ,
      ]);

      const stats = {
        totalUsers: Number((totalUsers as any).count || 0),
        dau: dau.map((r: any) => ({ day: r.day, users: r.users })),
        engagement: engagement.reduce((acc: any, cur: any) => ({ ...acc, [cur.type]: cur.count }), {}),
        pointPools: pools,
        totalTrees: Number((totalTrees as any).count || 0),
        lastPlantDate: (lastPlant as any)?.last_plant || null,
        alertDeliveryRates: { email: 0, push: 0 },
        owm: { errorRate: 0, avgLatencyMs: null },
        redis: { hitRate: 0.85 },
      };

      // cache result
      await redis.set(this.cacheKey, JSON.stringify(stats), 'EX', 120);
      return stats;
    } catch (error) {
      logger.error('Failed to compute admin stats', error);
      throw error;
    }
  }

  async getStats() {
    const cached = await redis.get(this.cacheKey);
    if (cached) return JSON.parse(cached);
    return this.computeStats();
  }
}

export const adminStatsService = new AdminStatsService();
