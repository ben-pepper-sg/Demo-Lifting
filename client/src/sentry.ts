import * as Sentry from '@sentry/react';

export const initSentry = () => {
  console.log('Frontend Sentry - Initializing with DSN:', process.env.REACT_APP_SENTRY_DSN ? 'SET' : 'NOT SET');
  console.log('Frontend Sentry - Environment:', process.env.NODE_ENV);
  
  if (!process.env.REACT_APP_SENTRY_DSN) {
    console.warn('REACT_APP_SENTRY_DSN not found in environment variables. Frontend Sentry will not be active.');
    return;
  }
  
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.REACT_APP_VERSION || '1.0.0',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Add beforeSend hook for debugging
    beforeSend(event) {
      console.log('Frontend Sentry beforeSend hook called with event:', {
        event_id: event.event_id,
        exception: event.exception,
        tags: event.tags,
        environment: event.environment
      });
      return event;
    },
  });
  
  console.log('Frontend Sentry initialized successfully');
  
  // Test frontend Sentry connection
  Sentry.addBreadcrumb({
    message: 'Frontend Sentry initialization test',
    level: 'info',
  });
};
