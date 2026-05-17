import { Response } from 'express';

export class HttpException extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(customMessage?: string) {
    super(500, customMessage ?? 'Internal Server Error');
  }
}

export class ConflictException extends HttpException {
  constructor(customMessage?: string) {
    super(409, customMessage ?? 'conflict');
  }
}

export class BadException extends HttpException {
  constructor(
    customMessage?: string,
    public readonly extras?: Record<string, unknown>
  ) {
    super(400, customMessage ?? 'Bad Request');
  }
}

export class ForbiddenException extends HttpException {
  constructor(customMessage?: string) {
    super(403, customMessage ?? 'Forbidden');
  }
}

export class UnAuthorizedException extends HttpException {
  constructor(customMessage?: string) {
    super(401, customMessage ?? 'UNAUTHORIZED');
  }
}

export class NotFoundException extends HttpException {
  constructor(customMessage?: string) {
    super(404, customMessage ?? 'Not Found');
  }
}

export class ProviderException extends HttpException {
  constructor(code: number, customMessage?: string) {
    super(code, customMessage ?? 'Not Found');
  }
}

export const handleCustomError = (res: Response, error: any, statusCode: number, code: string, message?: any) => {
  const base: Record<string, unknown> = {
    status: false,
    error: {
      code: code ?? 'INTERNAL_SERVER_ERROR',
      message: message ? message || error.message : error.message || 'An error occurred',
      details: null,
    }
  };
  if (error?.extras && typeof error.extras === 'object') {
    Object.assign(base, error.extras);
  }
  return res.status(statusCode).json(base);
};

export const handleCustomSuccess = (res: Response, message: string, statusCode: number, data?: any) => {
  return res.status(statusCode).json({
    status: true,
    statusCode,
    message,
    ...(data && { data })
  });
};
