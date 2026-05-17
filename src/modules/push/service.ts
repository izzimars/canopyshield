import { logger } from '../../config/logger';
import { redis } from '../../config/redis';
import { webpush } from '../../config/push';
import { pushRepository, PushSubscriptionRecord } from './repositories';
import { PushPayload } from './dto';

const DEFAULT_DEDUP_TTL_SECONDS = 60 * 60;
const QUIZ_REMINDER_TTL_SECONDS = 24 * 60 * 60;

export class PushNotificationService {
  private async shouldSend(userId: string, payload: PushPayload): Promise<boolean> {
    if (!payload.eventType || !payload.dedupId) {
      return true;
    }

    const ttl = payload.dedupTtlSeconds ?? (payload.eventType === 'quiz-reminder' ? QUIZ_REMINDER_TTL_SECONDS : DEFAULT_DEDUP_TTL_SECONDS);
    const key = `notif:dedup:${payload.eventType}:${userId}:${payload.dedupId}`;
    const existing = await redis.get(key);
    if (existing) {
      return false;
    }

    await redis.set(key, '1', 'EX', ttl);
    return true;
  }

  private buildPayload(payload: PushPayload): string {
    return JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: payload.icon,
      data: payload.data ?? {},
    });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subscriptions = await pushRepository.findByUser(userId);
    if (subscriptions.length === 0) {
      return;
    }

    const allowed = await this.shouldSend(userId, payload);
    if (!allowed) {
      return;
    }

    for (const subscription of subscriptions) {
      await this.sendToSubscription(subscription, payload);
    }
  }

  async sendToSubscription(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<void> {
    const body = this.buildPayload(payload);
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, body);
      return;
    } catch (error: any) {
      if (error?.statusCode === 410) {
        await pushRepository.deleteByEndpoint(subscription.endpoint);
        return;
      }

      logger.warn('Push send failed, retrying once', {
        endpoint: subscription.endpoint,
        error: error?.message ?? String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await webpush.sendNotification(pushSubscription, body);
      } catch (retryError: any) {
        if (retryError?.statusCode === 410) {
          await pushRepository.deleteByEndpoint(subscription.endpoint);
          return;
        }

        logger.error('Push send failed after retry', {
          endpoint: subscription.endpoint,
          error: retryError?.message ?? String(retryError),
        });
      }
    }
  }

  async sendBulk(users: string[], payload: PushPayload): Promise<void> {
    for (const userId of users) {
      await this.sendToUser(userId, payload);
    }
  }

  async sendToSchoolUsers(schoolId: string, riskScore: number, payload: PushPayload): Promise<void> {
    const recipients = await pushRepository.listSchoolRecipients(schoolId, riskScore);
    await this.sendBulk(recipients, payload);
  }

  async sendQuizReminder(payload: PushPayload): Promise<void> {
    const recipients = await pushRepository.listVerifiedUserIds();
    await this.sendBulk(recipients, payload);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await pushRepository.deleteByUserAndEndpoint(userId, endpoint);
  }
}

export const pushNotificationService = new PushNotificationService();
