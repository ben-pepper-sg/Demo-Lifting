import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { useAuth } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
    });
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  const fillForm = (overrides = {}) => {
    const defaultData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      ...overrides,
    };

    if (defaultData.firstName) {
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: defaultData.firstName },
      });
    }
    
    if (defaultData.lastName) {
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: defaultData.lastName },
      });
    }
    
    if (defaultData.email) {
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: defaultData.email },
      });
    }
    
    if (defaultData.password) {
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: defaultData.password },
      });
    }
    
    if (defaultData.confirmPassword) {
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: defaultData.confirmPassword },
      });
    }

    return defaultData;
  };

  it('renders registration form elements', () => {
    renderRegisterPage();
    
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderRegisterPage();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    expect(firstNameInput).toBeInvalid();
    expect(lastNameInput).toBeInvalid();
    expect(emailInput).toBeInvalid();
    expect(passwordInput).toBeInvalid();
    expect(confirmPasswordInput).toBeInvalid();
  });

  it('validates password confirmation match', async () => {
    renderRegisterPage();
    
    fillForm({
      password: 'password123',
      confirmPassword: 'differentpassword',
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password minimum length', () => {
    renderRegisterPage();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    expect(passwordInput).toHaveAttribute('minLength', '6');
    expect(confirmPasswordInput).toHaveAttribute('minLength', '6');
  });

  it('handles successful registration', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderRegisterPage();

    const formData = fillForm();
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Email already exists';
    mockRegister.mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    renderRegisterPage();
    fillForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });
  });

  it('handles registration failure without specific error message', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    renderRegisterPage();
    fillForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('navigates to login page when sign in link is clicked', () => {
    renderRegisterPage();
    
    const signInLink = screen.getByText(/sign in/i);
    fireEvent.click(signInLink);

    expect(window.location.pathname).toBe('/login');
  });

  it('updates form fields correctly', () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('clears error message when form is resubmitted', async () => {
    // First submission fails
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: 'Email already exists' } },
    });

    renderRegisterPage();
    fillForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    // Second submission succeeds
    mockRegister.mockResolvedValueOnce(undefined);
    fireEvent.click(submitButton);

    // Error should be cleared
    expect(screen.queryByText('Email already exists')).not.toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderRegisterPage();
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('has proper button states', async () => {
      mockRegister.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderRegisterPage();
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).not.toBeDisabled();
      
      fillForm();
      fireEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();
    });
  });
});
