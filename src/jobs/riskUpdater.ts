import cron from 'node-cron';
import { logger } from '../config/logger';
import schoolRiskService from '../modules/schools/services';

let riskUpdaterStarted = false;

export async function initializeRiskUpdaterJob(): Promise<void> {
  if (riskUpdaterStarted) {
    return;
  }

  // Run immediately on startup
  try {
    await schoolRiskService.recomputeAllSchoolsRisk();
    logger.info('Initial risk recomputation completed');
  } catch (error) {
    logger.error('Initial risk recomputation failed', { error: (error as Error).message });
  }

  let isRunning = false;

  cron.schedule('*/30 * * * *', async () => {
    if (isRunning) {
      logger.warn('Risk updater cron is still running, skipping this execution');
      return;
    }

    isRunning = true;
    logger.info('Risk updater cron started');

    try {
      await schoolRiskService.recomputeAllSchoolsRisk();
      logger.info('Risk updater cron completed');
    } catch (error) {
      isRunning = false;
      logger.error('Risk updater cron failed', { error: (error as Error).message });
    }
  });

  riskUpdaterStarted = true;
  logger.info('Risk updater cron initialized (every 30 minutes)');
}
