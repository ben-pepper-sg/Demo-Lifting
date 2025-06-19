import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';

export const initSentry = () => {
  console.log('Initializing Sentry with DSN:', process.env.SENTRY_DSN ? 'SET' : 'NOT SET');
  console.log('Environment:', process.env.NODE_ENV);
  
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN not found in environment variables. Sentry will not be active.');
    return;
  }
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Profiling
    profilesSampleRate: 1.0,
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Add beforeSend hook for debugging
    beforeSend(event) {
      console.log('Sentry beforeSend hook called with event:', {
        event_id: event.event_id,
        exception: event.exception,
        tags: event.tags,
        environment: event.environment
      });
      return event;
    },
  });
  
  console.log('Sentry initialized successfully');
  
  // Test Sentry connection
  Sentry.addBreadcrumb({
    message: 'Sentry initialization test',
    level: 'info',
  });
};

export { Sentry };

// Export handlers for middleware - using direct imports
export const requestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Basic request context capture
  Sentry.setContext('request', {
    url: req.url,
    method: req.method,
    headers: req.headers,
  });
  next();
};

export const tracingHandler = (req: Request, res: Response, next: NextFunction) => {
  // Basic tracing - simplified for newer Sentry version
  Sentry.addBreadcrumb({
    message: `${req.method} ${req.path}`,
    category: 'http',
    level: 'info',
  });
  
  next();
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.log('Sentry error handler called with error:', error.message);
  
  // Only capture if Sentry is initialized
  if (process.env.SENTRY_DSN) {
    // Capture exception with Sentry
    Sentry.captureException(error, {
      contexts: {
        request: {
          url: req.url,
          method: req.method,
          headers: req.headers,
        },
      },
    });
    console.log('Error captured by Sentry');
  } else {
    console.log('Sentry not configured, error not captured');
  }
  
  next(error);
};
