import { NextFunction, Request, Response } from 'express';
import { logger } from '../../config/logger';
import { HttpException } from '../errors';

export function GlobalErrorCatcherMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.info('shared::middleware::GlobalErrorCatcherMiddleware');
  logger.error(err);

  const isHttpException = err instanceof HttpException;

  if (err?.code == null || !isHttpException) {
    res.status(500).send('Internal Server Error');
    return;
  }
  res.status(err.code).send(err.message);
}
