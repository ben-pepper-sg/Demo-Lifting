import React, { useState } from 'react';
import * as Sentry from '@sentry/react';

const FrontendErrorTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateJavaScriptError = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create and throw a JavaScript error
      const testError = new Error('This is a frontend JavaScript error for Sentry testing');
      testError.name = 'FrontendTestError';
      
      // Manually capture with Sentry
      console.log('Capturing frontend error with Sentry...');
      const eventId = Sentry.captureException(testError, {
        tags: {
          test: true,
          location: 'frontend',
          page: 'fe-error'
        },
        extra: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          currentUrl: window.location.href
        }
      });
      
      console.log('Frontend error captured by Sentry with event ID:', eventId);
      
      // Force flush to ensure error is sent immediately
      Sentry.flush(2000).then(() => {
        console.log('Frontend Sentry flush completed');
      }).catch(err => {
        console.log('Frontend Sentry flush failed:', err);
      });
      
      // Also throw the error to trigger error boundaries
      throw testError;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateUnhandledError = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      // This will be an unhandled error that Sentry should catch automatically
      throw new Error('Unhandled frontend error for Sentry testing');
    }, 100);
  };

  const generatePromiseRejection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create an unhandled promise rejection (this will be caught by Sentry automatically)
      setTimeout(() => {
        Promise.reject(new Error('Unhandled promise rejection for Sentry testing'));
      }, 100);
      
      // Also create a handled rejection for comparison
      await Promise.reject(new Error('Handled promise rejection for Sentry testing'));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promise rejection occurred');
      console.log('Handled promise rejection:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTypeError = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a TypeError
      const obj: any = null;
      obj.nonExistentMethod(); // This will throw a TypeError
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Type error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testSentryConnection = () => {
    console.log('Testing Sentry connection...');
    console.log('REACT_APP_SENTRY_DSN exists:', !!process.env.REACT_APP_SENTRY_DSN);
    
    // Test if Sentry is working with a simple message
    const eventId = Sentry.captureMessage('Frontend Sentry connection test', 'info');
    console.log('Test message sent with event ID:', eventId);
    
    setError('Sentry connection test sent - check console and Sentry dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Frontend Error Test Page
        </h1>
        <p className="text-gray-600 mb-8">
          Click the buttons below to generate different types of frontend errors for Sentry testing.
        </p>
        
        <div className="mb-6">
          <button
            onClick={testSentryConnection}
            className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8 rounded transition-colors"
          >
            Test Sentry Connection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={generateJavaScriptError}
            disabled={loading}
            className="btn-primary text-lg py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate JS Error'}
          </button>

          <button
            onClick={generateUnhandledError}
            disabled={loading}
            className="btn-secondary text-lg py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Unhandled Error'}
          </button>

          <button
            onClick={generatePromiseRejection}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Promise Rejection'}
          </button>

          <button
            onClick={generateTypeError}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-lg py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate TypeError'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Generated:</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-red-600 text-sm mt-2">
              Check your browser console and Sentry dashboard for error details.
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Testing Notes:</h3>
          <ul className="text-blue-700 text-sm space-y-1 text-left">
            <li>• <strong>Test Connection:</strong> Sends a simple message to verify Sentry is working</li>
            <li>• <strong>JS Error:</strong> Manually captured and thrown error with custom tags</li>
            <li>• <strong>Unhandled Error:</strong> Async error that should be auto-captured by Sentry</li>
            <li>• <strong>Promise Rejection:</strong> Tests both handled and unhandled promise rejections</li>
            <li>• <strong>TypeError:</strong> Simulates common null reference errors</li>
          </ul>
          <p className="text-blue-600 text-xs mt-2">
            All errors are intentional for testing purposes and should appear in your Sentry dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FrontendErrorTestPage;
