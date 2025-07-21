import React, { useState } from 'react';
import * as Sentry from '@sentry/react';

export default function ErrorPage() {
  const [asyncCounter, setAsyncCounter] = useState(0);

  // 1. JavaScript Error
  const throwJavaScriptError = () => {
    throw new Error('This is a test JavaScript error thrown from ErrorPage');
  };

  // 2. Type Error
  const throwTypeError = () => {
    const obj: any = null;
    obj.property.nonExistentProperty(); // This will throw a TypeError
  };

  // 3. Reference Error
  const throwReferenceError = () => {
    // @ts-ignore - intentionally accessing undefined variable
    console.log(undefinedVariable.property);
  };

  // 4. Network Error (Promise rejection)
  const throwNetworkError = async () => {
    try {
      const response = await fetch('https://httpstat.us/500');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };

  // 5. Async Error with setTimeout
  const throwAsyncError = () => {
    setTimeout(() => {
      throw new Error('This is an async error thrown after 1 second');
    }, 1000);
  };

  // 6. Promise Rejection
  const throwPromiseRejection = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('This promise was rejected intentionally'));
      }, 500);
    });
  };

  // 7. Custom Error with context
  const throwCustomError = () => {
    console.log('Throwing custom error with Sentry context...');
    Sentry.withScope((scope) => {
      scope.setTag('errorType', 'custom');
      scope.setLevel('error');
      scope.setContext('userAction', {
        action: 'button_click',
        component: 'ErrorPage',
        timestamp: new Date().toISOString(),
      });
      scope.setUser({
        id: 'test-user',
        email: 'test@example.com',
      });
      
      const error = new Error('Custom error with additional context');
      console.log('Capturing custom error to Sentry:', error);
      Sentry.captureException(error);
      throw error;
    });
  };

  // 8. Division by zero (returns Infinity, not actually an error)
  const createMathError = () => {
    const result = 1 / 0;
    const error = new Error(`Math operation resulted in: ${result}`);
    Sentry.captureException(error);
    throw error;
  };

  // 9. JSON Parse Error
  const throwJSONError = () => {
    const invalidJSON = "{ invalid: json, syntax }";
    JSON.parse(invalidJSON); // This will throw a SyntaxError
  };

  // 10. Memory intensive operation (potential performance issue)
  const createPerformanceIssue = () => {
    try {
      // Create a large array to simulate memory pressure
      const largeArray = new Array(1000000).fill(0).map((_, i) => ({
        id: i,
        data: `item-${i}`,
        timestamp: Date.now(),
        largeString: 'x'.repeat(1000)
      }));
      
      // Simulate processing
      let sum = 0;
      for (let i = 0; i < largeArray.length; i++) {
        sum += i;
      }
      
      const error = new Error(`Performance issue: processed ${largeArray.length} items, sum: ${sum}`);
      Sentry.captureException(error);
      throw error;
    } catch (error) {
      throw error;
    }
  };

  // 11. React State Error
  const throwReactStateError = () => {
    setAsyncCounter(prevCounter => {
      if (prevCounter > 5) {
        throw new Error('React state counter exceeded maximum value');
      }
      return prevCounter + 1;
    });
  };

  const handleErrorAction = async (errorFunction: () => void | Promise<void>, errorName: string) => {
    try {
      await errorFunction();
    } catch (error) {
      console.error(`${errorName} triggered:`, error);
      // Error is already captured by global handlers or individual functions
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Error Testing Page
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This page contains buttons that generate various types of errors for Sentry testing.
            Each error should be captured and sent to Sentry for monitoring.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    These buttons will generate real errors. Use in development/testing environments only.
                    Make sure your Sentry DSN is configured to see the captured errors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* JavaScript Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">JavaScript Error</h3>
            <p className="text-sm text-gray-600 mb-4">Throws a basic JavaScript Error</p>
            <button
              onClick={() => handleErrorAction(throwJavaScriptError, 'JavaScript Error')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Throw JS Error
            </button>
          </div>

          {/* Type Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Type Error</h3>
            <p className="text-sm text-gray-600 mb-4">Accesses property on null object</p>
            <button
              onClick={() => handleErrorAction(throwTypeError, 'Type Error')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Throw Type Error
            </button>
          </div>

          {/* Reference Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Reference Error</h3>
            <p className="text-sm text-gray-600 mb-4">References undefined variable</p>
            <button
              onClick={() => handleErrorAction(throwReferenceError, 'Reference Error')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Throw Reference Error
            </button>
          </div>

          {/* Network Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Network Error</h3>
            <p className="text-sm text-gray-600 mb-4">Failed HTTP request (500 error)</p>
            <button
              onClick={() => handleErrorAction(throwNetworkError, 'Network Error')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              Trigger Network Error
            </button>
          </div>

          {/* Async Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Async Error</h3>
            <p className="text-sm text-gray-600 mb-4">Error thrown after setTimeout</p>
            <button
              onClick={() => handleErrorAction(throwAsyncError, 'Async Error')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              Throw Async Error
            </button>
          </div>

          {/* Promise Rejection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Promise Rejection</h3>
            <p className="text-sm text-gray-600 mb-4">Rejected promise without catch</p>
            <button
              onClick={() => {
                throwPromiseRejection(); // Don't await to create unhandled rejection
              }}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              Trigger Promise Rejection
            </button>
          </div>

          {/* Custom Error with Context */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Error</h3>
            <p className="text-sm text-gray-600 mb-4">Error with additional context data</p>
            <button
              onClick={() => handleErrorAction(throwCustomError, 'Custom Error')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Throw Custom Error
            </button>
          </div>

          {/* Math Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Math Error</h3>
            <p className="text-sm text-gray-600 mb-4">Mathematical operation error</p>
            <button
              onClick={() => handleErrorAction(createMathError, 'Math Error')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Create Math Error
            </button>
          </div>

          {/* JSON Parse Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">JSON Parse Error</h3>
            <p className="text-sm text-gray-600 mb-4">Invalid JSON syntax error</p>
            <button
              onClick={() => handleErrorAction(throwJSONError, 'JSON Parse Error')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Throw JSON Error
            </button>
          </div>

          {/* Performance Issue */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Issue</h3>
            <p className="text-sm text-gray-600 mb-4">Memory intensive operation</p>
            <button
              onClick={() => handleErrorAction(createPerformanceIssue, 'Performance Issue')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
            >
              Create Performance Issue
            </button>
          </div>

          {/* React State Error */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">React State Error</h3>
            <p className="text-sm text-gray-600 mb-4">Error in state update (Counter: {asyncCounter})</p>
            <button
              onClick={() => handleErrorAction(throwReactStateError, 'React State Error')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Trigger State Error
            </button>
          </div>

          {/* Manual Sentry Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Manual Sentry Capture</h3>
            <p className="text-sm text-gray-600 mb-4">Directly capture message to Sentry</p>
            <button
              onClick={() => {
                console.log('Manually sending test data to Sentry...');
                console.log('Sentry DSN available:', !!process.env.REACT_APP_SENTRY_DSN);
                Sentry.captureMessage('Manual test message from ErrorPage', 'info');
                Sentry.captureException(new Error('Manual test exception'));
                console.log('Manual Sentry calls completed');
                alert('Message and exception sent to Sentry! Check console for debug info.');
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Send Test to Sentry
            </button>
          </div>

        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Info
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Check your Sentry dashboard to see captured errors. Errors should appear within a few seconds.
                    Each error type provides different information useful for debugging and monitoring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
