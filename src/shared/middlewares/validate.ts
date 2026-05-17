import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../../config/logger';

/**
 * Validation middleware factory: validates request body/query/params against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('shared::middleware::validate');
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = validated.body ?? req.body;
      req.query = validated.query ?? req.query;
      req.params = validated.params ?? req.params;
      logger.info('Validation successful');
      next();
    } catch (error: any) {
      logger.error('Validation error:', error.message);
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          error_type: error.name || 'ValidationError',
          details: error.errors || error.message,
        },
      });
    }
  };
};
