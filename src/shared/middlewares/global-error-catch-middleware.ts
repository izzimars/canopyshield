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
  logger.error(err.message);

  // Default values (500)
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // 1. Handle body-parser JSON syntax errors (like your trailing comma issue)
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    statusCode = 400;
    errorCode = 'INVALID_JSON_PAYLOAD';
    message = 'Invalid JSON format in request body';
    details = err.message; // original parse error (optional)
  }
  // 2. Handle your custom HttpException (if you use it)
  else if (err instanceof HttpException) {
    statusCode = err.code || 500;
    errorCode = 'HTTP_EXCEPTION';
    message = err.message;
    details = null;
  }
  // 3. Handle other known error shapes that have statusCode/code
  else if (err.statusCode && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    errorCode = err.code || 'REQUEST_ERROR';
    message = err.message || 'Request failed';
    details = err.details || null;
  }
  else if (err.status && typeof err.status === 'number') {
    statusCode = err.status;
    errorCode = err.code || 'REQUEST_ERROR';
    message = err.message || 'Request failed';
    details = err.details || null;
  }
  // 4. For any other error, keep defaults (already set)
  //    but you can also map Prisma, Joi, etc. here.

  // Return error in your standard format
  return res.status(statusCode).json({
    status: false,
    error: {
      code: errorCode,
      message: message,
      details: details,
    },
  });
}