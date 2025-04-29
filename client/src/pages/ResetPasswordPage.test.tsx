import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import { useAuth } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock implementations
const mockResetPassword = jest.fn();
const mockNavigate = jest.fn();

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
    });
    
    (useParams as jest.Mock).mockReturnValue({
      token: 'valid-reset-token',
    });
    
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    );
  };

  it('should render the reset password form', () => {
    renderComponent();
    
    // Check that form elements are present
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('should show error for password mismatch', async () => {
    renderComponent();
    
    // Fill with mismatched passwords
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    // Error should be displayed immediately (no API call)
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should show error for password too short', async () => {
    renderComponent();
    
    // Fill with short password
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    // Error should be displayed immediately (no API call)
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should reset password successfully and redirect', async () => {
    // Mock success response
    mockResetPassword.mockResolvedValue(undefined);
    
    renderComponent();
    
    // Fill with valid passwords
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'NewSecurePassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'NewSecurePassword123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    // Verify loading state
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
    });
    
    // Verify API call with correct data
    expect(mockResetPassword).toHaveBeenCalledWith('valid-reset-token', 'NewSecurePassword123');
    
    // Wait for redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    const errorMessage = 'Invalid or expired reset token';
    mockResetPassword.mockRejectedValue({
      response: {
        data: {
          error: errorMessage
        }
      }
    });
    
    renderComponent();
    
    // Fill with valid passwords
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPassword123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Form should still be visible and enabled
    expect(screen.getByRole('button', { name: /reset password/i })).not.toBeDisabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show error for missing token', () => {
    // Mock missing token
    (useParams as jest.Mock).mockReturnValueOnce({});
    
    renderComponent();
    
    // Error should be displayed
    expect(screen.getByText(/invalid reset token/i)).toBeInTheDocument();
    
    // Form should not be submittable
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});