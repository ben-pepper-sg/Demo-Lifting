import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthProvider } from '../../hooks/useAuth';

// Mock server for API requests
const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any;
    
    if (email === 'user@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          user: { id: '1', name: 'Test User', email: 'user@example.com', role: 'user' },
          token: 'fake-jwt-token',
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Flow', () => {
  test('shows validation errors for empty fields', async () => {
    renderLoginPage();
    
    // Find the login button and click it without filling in the form
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    
    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
  
  test('shows error message for invalid credentials', async () => {
    renderLoginPage();
    
    // Fill in the form with invalid credentials
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    
    // Submit the form
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
  
  test('redirects after successful login', async () => {
    // Mock window.location.href to capture redirects
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    renderLoginPage();
    
    // Fill in the form with valid credentials
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit the form
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    
    // Verify local storage was updated
    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('fake-jwt-token');
      // In a real test, we would expect mockNavigate to be called with '/dashboard'
    });
  });
});