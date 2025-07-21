import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react";

// Initialize Sentry
const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
console.log('Sentry DSN configured:', sentryDsn ? 'Yes' : 'No');
console.log('Sentry DSN (first 30 chars):', sentryDsn ? sentryDsn.substring(0, 30) + '...' : 'Not set');
console.log('Raw environment variable:', process.env.REACT_APP_SENTRY_DSN);
console.log('All REACT_APP environment variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));

if (sentryDsn && sentryDsn !== 'your-sentry-dsn-here') {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: true, // Enable debug mode to see Sentry logs
    beforeSend(event) {
      console.log('Sentry event being sent:', event);
      return event;
    },
  });
  console.log('Sentry initialized successfully');
} else {
  console.warn('Sentry not initialized: DSN not configured or using placeholder value');
}

// Global error handlers for better error reporting
window.addEventListener('error', (event) => {
  console.error('Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  if (sentryDsn && sentryDsn !== 'your-sentry-dsn-here') {
    console.log('Capturing error to Sentry:', event.error);
    Sentry.captureException(event.error);
  } else {
    console.log('Sentry not configured, error not sent');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Prevent generic "Async operation failed" by providing more specific error
  if (event.reason && typeof event.reason === 'object') {
    if (event.reason.message === 'Async operation failed' || !event.reason.message) {
      event.reason.message = event.reason.message || 'Promise rejected without specific error message';
    }
  }
  
  if (sentryDsn && sentryDsn !== 'your-sentry-dsn-here') {
    console.log('Capturing promise rejection to Sentry:', event.reason);
    Sentry.captureException(event.reason);
  } else {
    console.log('Sentry not configured, promise rejection not sent');
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Use Sentry ErrorBoundary
const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-4">An error occurred and has been reported.</p>
          <button
            onClick={resetError}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try again
          </button>
        </div>
      </div>
    ),
    beforeCapture: (scope) => {
      scope.setTag("errorBoundary", true);
    },
  }
);

root.render(
  <React.StrictMode>
    <SentryErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SentryErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();