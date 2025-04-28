import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import { useAuth } from '../../hooks/useAuth';
// Mock dependencies
jest.mock('../../hooks/useAuth');

// Console mock for warnings
const originalConsoleWarn = console.warn;
const mockConsoleWarn = jest.fn();
console.warn = mockConsoleWarn;

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdminRoute', () => {
  const renderComponent = (children: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AdminRoute>{children}</AdminRoute>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
  });
  
  afterAll(() => {
    console.warn = originalConsoleWarn;
  });

  it('should render children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'ADMIN', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', maxBench: null, maxOHP: null, maxSquat: null, maxDeadlift: null },
      loading: false,
      token: 'test-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
    });

    renderComponent(<div>Admin Content</div>);
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should redirect and log a warning when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', role: 'USER', email: 'user@test.com', firstName: 'Regular', lastName: 'User', maxBench: null, maxOHP: null, maxSquat: null, maxDeadlift: null },
      loading: false,
      token: 'test-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
    });

    renderComponent(<div>Admin Content</div>);
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Unauthorized admin access attempt',
      expect.objectContaining({
        userId: '2',
        userRole: 'USER',
        path: expect.any(String)
      })
    );
  });

  it('should redirect and log a warning when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
    });

    renderComponent(<div>Admin Content</div>);
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Unauthorized admin access attempt',
      expect.objectContaining({
        userRole: 'unauthenticated',
        path: expect.any(String)
      })
    );
  });

  it('should show loading indicator when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
    });

    renderComponent(<div>Admin Content</div>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });
});