import { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { getEnv } from '@deputy/config';

export const structuredErrorHandler: ErrorHandler = (err, c) => {
  const env = getEnv();
  const requestId = c.get('requestId') || 'unknown';

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request payload failed schema validation.',
          details: err.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
          requestId,
        },
      },
      400,
    );
  }

  // General internal error
  const isDev = env.NODE_ENV === 'development';
  console.error(`[Error] [Request ${requestId}]`, err);

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isDev ? err.message : 'An unexpected security or processing error occurred.',
        requestId,
        ...(isDev && { stack: err.stack }),
      },
    },
    500,
  );
};
