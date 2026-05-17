// Response envelope helpers
export class ResponseHelper {
  static success<T = unknown>(data: T, message?: string) {
    return {
      success: true as const,
      data,
      message,
    };
  }

  static error(code: string, message: string, details?: unknown) {
    return {
      success: false as const,
      error: {
        code,
        message,
        details,
      },
    };
  }
}

export const successResponse = ResponseHelper.success;
export const errorResponse = ResponseHelper.error;

export default ResponseHelper;
