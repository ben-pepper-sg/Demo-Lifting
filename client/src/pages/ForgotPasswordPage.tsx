import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState<{resetToken?: string, resetUrl?: string} | null>(null);
  
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetInfo(null);
    setIsLoading(true);
    
    try {
      const resetData = await requestPasswordReset(email);
      setSuccess('If a user with that email exists, a password reset link has been sent.');
      
      // In development only - show reset token info
      if (process.env.NODE_ENV === 'development') {
        setResetInfo(resetData);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Forgot Password</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="card">
        <p className="mb-4 text-gray-600">
          Enter your email address below and we'll send you a link to reset your password.
        </p>
        
        <div className="mb-6">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <div className="mt-4 sm:mt-0 text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </form>
      
      {/* Development help - show reset info */}
      {resetInfo && (
        <div className="mt-6 p-4 bg-yellow-100 rounded">
          <h3 className="font-medium mb-2">Development Info (not shown in production)</h3>
          <p className="mb-2"><strong>Reset Token:</strong> {resetInfo.resetToken}</p>
          <p className="mb-2"><strong>Reset URL:</strong> {resetInfo.resetUrl}</p>
          <div className="mt-2">
            <Link 
              to={`/reset-password/${resetInfo.resetToken}`} 
              className="text-primary-600 hover:underline"
            >
              Go to Reset Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;