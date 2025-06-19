import React, { useState } from 'react';
import * as Sentry from '@sentry/react';

// Force test Sentry with flush
const testSentryForced = async () => {
  console.log('🔧 Force testing Sentry...');
  try {
    const eventId = Sentry.captureMessage('Forced test message', 'error');
    console.log('📤 Captured event ID:', eventId);
    
    // Force flush
    await Sentry.flush(2000);
    console.log('🚀 Sentry flush completed');
    return true;
  } catch (error) {
    console.error('🔧 Sentry force test error:', error);
    return false;
  }
};

const FEErrorPage: React.FC = () => {
  const [lastError, setLastError] = useState<string>('');

  const generateJavaScriptError = () => {
    console.log('Button clicked: JavaScript Error');
    setLastError('JavaScript Error: Cannot read property of null');
    
    // Force test Sentry
    testSentryForced();
    
    // Test 1: Direct Sentry call
    console.log('📤 Calling Sentry.captureException directly...');
    const eventId = Sentry.captureException(new Error('Direct Sentry call test'), {
      tags: { test_type: 'direct_call' }
    });
    console.log('📤 Sentry returned event ID:', eventId);
    
    // Test 2: Throw an unhandled error that will be caught by Sentry
    setTimeout(() => {
      console.log('📤 Throwing unhandled error...');
      // @ts-ignore - Intentionally calling undefined method
      (null as any).someMethod();
    }, 100);
  };

  const generateTypeError = () => {
    console.log('Button clicked: Type Error');
    setLastError('Type Error: Cannot read property of undefined');
    // Throw an unhandled error that will be caught by Sentry
    setTimeout(() => {
      // @ts-ignore - Intentionally causing type error
      const obj: any = undefined;
      const result = obj.property.nested.value;
    }, 100);
  };

  const generateNetworkError = () => {
    console.log('Button clicked: Network Error');
    setLastError('Network Error: Failed to fetch from non-existent endpoint');
    // Create an unhandled promise rejection
    setTimeout(() => {
      fetch('/api/non-existent-endpoint')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network Error: ${response.status} ${response.statusText}`);
          }
        });
    }, 100);
  };

  const generateAsyncError = () => {
    console.log('Button clicked: Async Error');
    setLastError('Async Error: Promise rejected');
    // Create an unhandled promise rejection
    setTimeout(() => {
      new Promise((_, reject) => {
        reject(new Error('Async operation failed'));
      }).catch(error => {
        // Properly handle the async error to prevent unhandled promise rejection
        console.error('Async error handled:', error);
        Sentry.captureException(error, {
          tags: { error_type: 'async_operation' },
          extra: { handled: true }
        });
      });
    }, 100);
  };

  const generateCustomError = () => {
    console.log('Button clicked: Custom Error');
    setLastError('Custom Error: Test error generated');
    // Throw an unhandled error with custom context
    setTimeout(() => {
      const customError = new Error('Custom test error for Sentry monitoring');
      (customError as any).customData = {
        timestamp: new Date().toISOString(),
        user_action: 'manual_error_generation'
      };
      throw customError;
    }, 100);
  };

  const generateWarning = () => {
    console.log('Button clicked: Warning');
    const warningMsg = 'Warning: This is a test warning message';
    setLastError(warningMsg);
    
    // This one we'll keep as a manual Sentry call since warnings don't throw
    Sentry.captureMessage(warningMsg, {
      level: 'warning',
      tags: { message_type: 'warning' },
      extra: { trigger: 'fe_error_page_button' }
    });
  };

  const generateConsoleError = () => {
    const errorMsg = 'Console Error: Check browser console';
    setLastError(errorMsg);
    
    console.error('Test console error generated from FE Error page');
    // Also throw an uncaught error that will appear in console
    setTimeout(() => {
      throw new Error('Uncaught console error for testing');
    }, 100);
    
    Sentry.captureMessage('Console error generated', {
      level: 'error',
      tags: { error_type: 'console_error' },
      extra: { trigger: 'fe_error_page_button' }
    });
  };

  const throwUnhandledError = () => {
    console.log('Button clicked: Unhandled Error');
    setLastError('Unhandled Error: Component will crash');
    // This will be caught by the Sentry error boundary and crash the component
    throw new Error('Unhandled error - will crash component');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Frontend Error Testing Page
        </h1>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>This page generates real errors for testing purposes. All errors are captured by Sentry.</p>
              </div>
            </div>
          </div>
        </div>

        {lastError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Last Error Generated
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{lastError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={generateJavaScriptError}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            JavaScript Error
          </button>

          <button
            onClick={generateTypeError}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Type Error
          </button>

          <button
            onClick={generateNetworkError}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Network Error
          </button>

          <button
            onClick={generateAsyncError}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Async Error
          </button>

          <button
            onClick={generateCustomError}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Custom Error
          </button>

          <button
            onClick={generateWarning}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Warning Message
          </button>

          <button
            onClick={generateConsoleError}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Console Error
          </button>

          <button
            onClick={throwUnhandledError}
            className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Unhandled Error (Crashes)
          </button>
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Error Types Generated
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>JavaScript Error:</strong> Null reference error</li>
            <li><strong>Type Error:</strong> Undefined property access</li>
            <li><strong>Network Error:</strong> Failed HTTP request</li>
            <li><strong>Async Error:</strong> Promise rejection</li>
            <li><strong>Custom Error:</strong> Manually created error with context</li>
            <li><strong>Warning Message:</strong> Non-error message to Sentry</li>
            <li><strong>Console Error:</strong> Error logged to browser console</li>
            <li><strong>Unhandled Error:</strong> Component-crashing error</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sentry.withProfiler(FEErrorPage, { name: 'FEErrorPage' });
