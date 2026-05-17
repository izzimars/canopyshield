import app from './config/express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { initializeRiskUpdaterJob } from './jobs/riskUpdater';
import { initializeQuizReminderJob } from './jobs/quizReminder';
import { initializePushConfig } from './config/push';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await redis.ping();
  initializePushConfig();
  initializeRiskUpdaterJob();
  initializeQuizReminderJob();

  app.listen(env.PORT, () => {
    logger.info('CanopyShield server started', { port: env.PORT }, );
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error: error.message }, );
  throw error;
});
