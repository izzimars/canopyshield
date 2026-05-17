import cron from 'node-cron';
import { logger } from '../config/logger';
import { pushNotificationService } from '../modules/push/service';

let quizReminderStarted = false;

export function initializeQuizReminderJob(): void {
  if (quizReminderStarted) {
    return;
  }

  cron.schedule('0 9 * * *', async () => {
    logger.info('Quiz reminder cron started');

    try {
      await pushNotificationService.sendQuizReminder({
        title: 'Quiz Reminder',
        body: 'Don\'t forget to answer today\'s quiz!',
        url: '/quiz/today',
        eventType: 'quiz-reminder',
        dedupId: new Date().toISOString().slice(0, 10),
        dedupTtlSeconds: 24 * 60 * 60,
      });
      logger.info('Quiz reminder cron completed');
    } catch (error) {
      logger.error('Quiz reminder cron failed', { error: (error as Error).message });
    }
  });

  quizReminderStarted = true;
  logger.info('Quiz reminder cron initialized (daily at 9am)');
}
