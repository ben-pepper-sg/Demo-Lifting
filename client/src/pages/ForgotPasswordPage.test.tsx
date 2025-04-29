import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { useAuth } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the useAuth implementation
const mockRequestPasswordReset = jest.fn();

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );
  };

  it('should render the forgot password form', () => {
    renderComponent();
    
    // Check that form elements are present
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('should handle email submission', async () => {
    // Mock success response
    mockRequestPasswordReset.mockResolvedValue({
      resetToken: 'test-token',
      resetUrl: 'http://localhost:3000/reset-password/test-token'
    });
    
    renderComponent();
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);
    
    // Verify loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
    });
    
    // Verify the API was called with correct data
    expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    const errorMessage = 'Failed to request password reset';
    mockRequestPasswordReset.mockRejectedValue({
      response: {
        data: {
          error: errorMessage
        }
      }
    });
    
    renderComponent();
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verify the button is enabled again
    expect(screen.getByRole('button', { name: /send reset link/i })).not.toBeDisabled();
  });

  it('should hide development info in production', async () => {
    // Save original env
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Mock production environment
    process.env.NODE_ENV = 'production';
    
    // Mock successful response
    mockRequestPasswordReset.mockResolvedValue({
      resetToken: 'test-token',
      resetUrl: 'http://localhost:3000/reset-password/test-token'
    });
    
    renderComponent();
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/email address/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
    });
    
    // Development info should not be visible
    expect(screen.queryByText(/development info/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reset token:/i)).not.toBeInTheDocument();
    
    // Restore original env
    process.env.NODE_ENV = originalNodeEnv;
  });
});