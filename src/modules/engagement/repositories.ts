import { db } from '../../config/database';
import engagementQueries from './query';

export class QuizRepository {
  async insertQuestion(text: string, options: any[], correctIndex: number, topicTag: string) {
    return db.one(engagementQueries.insertQuizQuestion, [text, options, correctIndex, topicTag]);
  }

  async selectRandomQuestion() {
    return db.oneOrNone(engagementQueries.selectRandomScheduledQuestion);
  }

  async findById(id: string) {
    return db.oneOrNone(engagementQueries.selectQuestionById, [id]);
  }
}

export class EngagementRepository {
  async insertEvent(userId: string, schoolId: string | null, type: string, points: number) {
    return db.one(engagementQueries.insertEngagementEvent, [userId, schoolId, type, points]);
  }

  async countUserShares(userId: string) {
    const r = await db.oneOrNone(engagementQueries.countUserShares, [userId]);
    return r ? Number(r.cnt) : 0;
  }

  async sumUserDonations(userId: string) {
    const r = await db.oneOrNone(engagementQueries.sumUserDonations, [userId]);
    return r ? Number(r.total) : 0;
  }
}

export class UserRepository {
  async getUser(userUuid: string) {
    return db.oneOrNone(engagementQueries.getUserById, [userUuid]);
  }

  async updatePoints(userUuid: string, newPoints: number) {
    return db.one(engagementQueries.updateUserPoints, [userUuid, newPoints]);
  }
}

export class SchoolPointsRepository {
  async upsert(schoolId: string, pointsToAdd: number) {
    return db.one(engagementQueries.upsertSchoolPoints, [schoolId, pointsToAdd]);
  }

  async get(schoolId: string) {
    return db.oneOrNone(engagementQueries.getSchoolPoints, [schoolId]);
  }
}

export class TreeRequestRepository {
  async insertIfMissing(schoolId: string) {
    return db.oneOrNone(engagementQueries.insertTreeRequestIfMissing, [schoolId]);
  }
}

export class BadgeRepository {
  async insertIfMissing(userId: string, type: string) {
    return db.oneOrNone(engagementQueries.insertBadgeIfMissing, [userId, type]);
  }
}

export const quizRepository = new QuizRepository();
export const engagementRepository = new EngagementRepository();
export const userRepository = new UserRepository();
export const schoolPointsRepository = new SchoolPointsRepository();
export const treeRequestRepository = new TreeRequestRepository();
export const badgeRepository = new BadgeRepository();
