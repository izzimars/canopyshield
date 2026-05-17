import { Request, Response } from 'express';
import { ExpressController } from '../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export const WatchAsyncController = (fn: ExpressController) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((error) => {
    console.error('Error caught in WatchAsyncController:', error);
    const logError = error.errors ?? error.message;
    logger.error('src::shared::utils::watch-async-controller::WatchAsyncController', logError);
    res.status(500).json({
      status: false,
      message: 'We encountered a problem while processing your request. Please try again',
      errors: env.NODE_ENV !== 'production' ? error.errors || error.message : null,
      details: env.NODE_ENV !== 'production' ? error.stack : null,
    });
  });
};
