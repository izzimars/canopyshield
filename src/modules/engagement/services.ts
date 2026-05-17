import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { quizRepository } from './repositories';
import { db } from '../../config/database';
import { badgeService } from './badgeService';
import { pushNotificationService } from '../push/service';

class QuizService {
  async getTodayQuestion() {
    logger.info('engagement::services::getTodayQuestion');
    const cacheKey = 'quiz:today';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const q = await quizRepository.selectRandomQuestion();
    if (q) {
      // hide correct index
      const toReturn = { question_uuid: q.question_uuid, question_text: q.question_text, options: q.options };
      await redis.set(cacheKey, JSON.stringify(toReturn), 'EX', 86400);
      return toReturn;
    }
    return null;
  }

  async attemptQuiz(userId: string, quizId: string, selectedOption: number) {
    logger.info('engagement::services::attemptQuiz');
    const todayKey = `quiz:${userId}:${new Date().toISOString().slice(0,10)}`;
    // atomic check via setnx
    const exists = await redis.get(todayKey);
    if (exists) {
      return { success: false, message: 'already answered' };
    }

    const q = await quizRepository.findById(quizId);
    if (!q) return { success: false, message: 'question not found' };

    const correct = Number(q.correct_index) === Number(selectedOption);

    // start DB transaction for points update and event logging
    const txResult = await db.tx(async (t) => {
      const userRow = await t.oneOrNone('SELECT points, school_id FROM users WHERE user_uuid = $1', [userId]);
      if (!userRow) throw new Error('User not found');

      let newPoints = Number(userRow.points || 0);
      if (correct) {
        newPoints += 10;
        await t.none('UPDATE users SET points = $1, updated_at = now() WHERE user_uuid = $2', [newPoints, userId]);
        await t.none('INSERT INTO engagement_events (user_id, school_id, type, points) VALUES ($1,$2,$3,$4)', [userId, userRow.school_id || null, 'quiz', 10]);
      } else {
        await t.none('INSERT INTO engagement_events (user_id, school_id, type, points) VALUES ($1,$2,$3,$4)', [userId, userRow.school_id || null, 'quiz', 0]);
      }

      // set redis key to prevent re-answering for 24h
      await redis.set(todayKey, '1', 'EX', 86400);

      return { success: true, correct, points: newPoints };
    });

    // outside transaction: award badges and push notifications (non-blocking)
    try {
      if (correct) {
        await badgeService.awardQuizStreakIfEligible(userId);
      }
    } catch (e) {
      logger.error('badge award failed', e);
    }

    return txResult;
  }

  async createQuestion(payload: {questionText:string, options:any[], correctOptionIndex:number, topicTag?:string}){
    logger.info('engagement::services::createQuestion');
    return quizRepository.insertQuestion(payload.questionText, payload.options, payload.correctOptionIndex, payload.topicTag || 'general');
  }
}

class ShareService {
  async share(userId: string) {
    logger.info('engagement::services::share');
    const key = `share:user:${userId}`;
    const exists = await redis.get(key);
    if (exists) {
      return { success: false, message: 'recently shared' };
    }

    // add 5 points to user and log event atomically
    const txRes = await db.tx(async (t) => {
      const user = await t.oneOrNone('SELECT points, school_id FROM users WHERE user_uuid = $1', [userId]);
      if (!user) throw new Error('User not found');
      const newPts = Number(user.points || 0) + 5;
      await t.none('UPDATE users SET points = $1, updated_at = now() WHERE user_uuid = $2', [newPts, userId]);
      await t.none('INSERT INTO engagement_events (user_id, school_id, type, points) VALUES ($1,$2,$3,$4)', [userId, user.school_id || null, 'share', 5]);
      await redis.set(key, '1', 'EX', 3600);
      // check badge eligibility: award alert_hero if shares>=3
      const cntR = await t.oneOrNone('SELECT COUNT(*)::int as cnt FROM engagement_events WHERE user_id = $1 AND type = $2', [userId, 'share']);
      const cnt = cntR ? Number(cntR.cnt) : 0;
      return { success: true, points: newPts, shareCount: cnt };
    });

    // award badge outside tx
    try {
      if (txRes.shareCount >= 3) {
        await badgeService.awardShareHeroIfEligible(userId);
      }
    } catch (e) {
      logger.error('badge award failed', e);
    }

    return { success: true, points: txRes.points };
  }
}

class DonationService {
  async donate(userId: string, schoolId: string, pointsToDonate: number) {
    logger.info('engagement::services::donate');
    const txRes = await db.tx(async (t) => {
      const user = await t.oneOrNone('SELECT points FROM users WHERE user_uuid = $1', [userId]);
      if (!user) throw new Error('User not found');
      const current = Number(user.points || 0);
      if (current < pointsToDonate) {
        return { success: false, message: 'insufficient points' };
      }
      const newUserPts = current - pointsToDonate;
      await t.none('UPDATE users SET points = $1, updated_at = now() WHERE user_uuid = $2', [newUserPts, userId]);
      await t.none('INSERT INTO engagement_events (user_id, school_id, type, points) VALUES ($1,$2,$3,$4)', [userId, schoolId, 'donation', pointsToDonate]);

      // upsert school points
      await t.none('INSERT INTO school_points (school_id, total) VALUES ($1,$2) ON CONFLICT (school_id) DO UPDATE SET total = school_points.total + EXCLUDED.total, updated_at = now()', [schoolId, pointsToDonate]);
      const sp = await t.one('SELECT total FROM school_points WHERE school_id = $1', [schoolId]);
      const total = Number(sp.total || 0);

      // if threshold reached, insert tree request
      if (total >= 100) {
        await t.none("INSERT INTO tree_requests (school_id, status) SELECT $1, 'pending' WHERE NOT EXISTS (SELECT 1 FROM tree_requests WHERE school_id=$1 AND status='pending')", [schoolId]);
      }

      // award tree_planter badge to user if cumulative donations >=100
      const sum = await t.oneOrNone('SELECT COALESCE(SUM(points),0)::int as total FROM engagement_events WHERE user_id=$1 AND type=$2', [userId, 'donation']);
      const userTotal = sum ? Number(sum.total) : 0;
      return { success: true, userPoints: newUserPts, schoolTotal: total, userDonationTotal: userTotal };
    });

    // award badges outside tx
    try {
      if (txRes?.userDonationTotal && txRes.userDonationTotal >= 100) {
        await badgeService.awardTreePlanter(userId);
      }

      if (txRes?.schoolTotal && txRes.schoolTotal >= 100) {
        await pushNotificationService.sendToSchoolUsers(schoolId, txRes.schoolTotal, {
          title: 'Tree Incoming!',
          body: 'Your school reached 100 points – a tree will be planted!',
          url: '/trees',
          eventType: 'tree-incoming',
          dedupId: schoolId,
          dedupTtlSeconds: 24 * 60 * 60,
        });
      }
    } catch (e) {
      logger.error('badge or push notification failed', e);
    }

    return { success: true, userPoints: txRes?.userPoints, schoolTotal: txRes?.schoolTotal };
  }
}

export const quizService = new QuizService();
export const shareService = new ShareService();
export const donationService = new DonationService();

export default {
  quizService,
  shareService,
  donationService,
};
