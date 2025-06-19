import React, { useState } from 'react';

const ErrorTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateError = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make a request to trigger a 503 error
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/generate-503-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger: '503' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          5XX Error Test Page
        </h1>
        <p className="text-gray-600 mb-8">
          Click the button below to generate a 503 Service Unavailable error.
        </p>
        
        <button
          onClick={generateError}
          disabled={loading}
          className="btn-primary text-lg py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Error...' : 'Generate an error'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Generated:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorTestPage;
