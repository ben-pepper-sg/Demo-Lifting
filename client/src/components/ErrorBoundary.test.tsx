import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';
import App from '../App';

// Mock the API service
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock hooks
jest.mock('../hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: null, login: jest.fn(), logout: jest.fn(), loading: false }),
}));

jest.mock('../hooks/useTheme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn() }),
}));

describe('App Router Error Handling', () => {
  it('should handle non-existent routes like /fe-error gracefully', () => {
    // This test should fail initially because we don't have proper 404 handling
    // for routes like /fe-error that don't exist
    
    // Navigate to /fe-error route
    window.history.pushState({}, 'Test page', '/fe-error');
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Should show 404 page or redirect to home, not throw uncaught error
    expect(screen.queryByText('404')).toBeTruthy();
  });
});
