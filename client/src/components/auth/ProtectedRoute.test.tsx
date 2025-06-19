import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

// Mock the auth hook and react-router-dom
jest.mock('../../hooks/useAuth');

// Mock axios to prevent module loading issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  const renderProtectedRoute = (children: React.ReactNode = <TestComponent />) => {
    return render(
      <BrowserRouter>
        <ProtectedRoute>{children}</ProtectedRoute>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    it('renders children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'USER',
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
          maxBench: null,
          maxOHP: null,
          maxSquat: null,
          maxDeadlift: null,
        },
        loading: false,
        token: 'test-token',
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        token: null,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
    });

    it('shows loading indicator when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        token: null,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('User Role Handling', () => {
    it('renders children for regular users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'USER',
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
          maxBench: 200,
          maxOHP: 150,
          maxSquat: 300,
          maxDeadlift: 350,
        },
        loading: false,
        token: 'test-token',
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('renders children for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          maxBench: null,
          maxOHP: null,
          maxSquat: null,
          maxDeadlift: null,
        },
        loading: false,
        token: 'admin-token',
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Loading State Styling', () => {
    it('loading indicator has proper styling classes', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        token: null,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      const loadingDiv = screen.getByText('Loading...');
      expect(loadingDiv).toHaveClass('flex', 'justify-center', 'items-center', 'h-screen');
    });
  });

  describe('Children Rendering', () => {
    it('renders different types of children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'USER',
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
          maxBench: null,
          maxOHP: null,
          maxSquat: null,
          maxDeadlift: null,
        },
        loading: false,
        token: 'test-token',
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      // Test with multiple children
      renderProtectedRoute(
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('renders string children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'USER',
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
          maxBench: null,
          maxOHP: null,
          maxSquat: null,
          maxDeadlift: null,
        },
        loading: false,
        token: 'test-token',
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute('String content');
      
      expect(screen.getByText('String content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles authentication error state gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        token: null,
        error: 'Authentication failed',
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      // Should redirect to login even with error
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('handles user with null token', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          role: 'USER',
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
          maxBench: null,
          maxOHP: null,
          maxSquat: null,
          maxDeadlift: null,
        },
        loading: false,
        token: null, // Token is null but user exists
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateMaxLifts: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderProtectedRoute();
      
      // Should render content if user exists, regardless of token
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
