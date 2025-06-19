import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { useAuth } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('HomePage', () => {
  const mockUseAuth = useAuth as jest.Mock;

  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
      });
    });

    it('renders main heading and description', () => {
      renderHomePage();
      
      expect(screen.getByText('TFW MMA Lifting Program')).toBeInTheDocument();
      expect(screen.getByText(/8-week progressive lifting program/i)).toBeInTheDocument();
    });

    it('shows sign in and register buttons in hero section', () => {
      renderHomePage();
      
      const signInButtons = screen.getAllByText('Sign In');
      const registerButtons = screen.getAllByText('Register');
      
      expect(signInButtons).toHaveLength(2); // Hero and CTA sections
      expect(registerButtons).toHaveLength(2); // Hero and CTA sections
    });

    it('displays program overview cards', () => {
      renderHomePage();
      
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Week Program')).toBeInTheDocument();
      expect(screen.getByText('Main Lifts')).toBeInTheDocument();
      expect(screen.getByText('20+')).toBeInTheDocument();
      expect(screen.getByText('Supplemental Exercises')).toBeInTheDocument();
      expect(screen.getByText('Days per Week')).toBeInTheDocument();
      
      // Check that there are two "4" elements (Main Lifts and Days per Week)
      expect(screen.getAllByText('4')).toHaveLength(2);
    });

    it('shows weekly schedule information', () => {
      renderHomePage();
      
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Monday (Upper Body)')).toBeInTheDocument();
      expect(screen.getByText('Tuesday (Lower Body)')).toBeInTheDocument();
      expect(screen.getByText('Wednesday (Upper Body)')).toBeInTheDocument();
      expect(screen.getByText('Thursday (Lower Body)')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
    });

    it('displays schedule times correctly', () => {
      renderHomePage();
      
      // Check that time slots are displayed (some appear multiple times across different days)
      expect(screen.getAllByText('4:00 PM - 5:00 PM (Upper Body)')).toHaveLength(2); // Mon & Wed
      expect(screen.getAllByText('5:00 PM - 6:00 PM (Upper Body)')).toHaveLength(2); // Mon & Wed
      expect(screen.getAllByText('4:00 PM - 5:00 PM (Lower Body)')).toHaveLength(2); // Tue & Thu
      expect(screen.getAllByText('9:00 AM - 10:00 AM (Upper & Lower Body)')).toHaveLength(1); // Sat
    });

    it('navigates to login page when sign in is clicked', () => {
      renderHomePage();
      
      const signInButton = screen.getAllByText('Sign In')[0];
      fireEvent.click(signInButton);
      
      expect(window.location.pathname).toBe('/login');
    });

    it('navigates to register page when register is clicked', () => {
      renderHomePage();
      
      const registerButton = screen.getAllByText('Register')[0];
      fireEvent.click(registerButton);
      
      expect(window.location.pathname).toBe('/register');
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'USER',
        },
      });
    });

    it('shows dashboard button instead of auth buttons in hero', () => {
      renderHomePage();
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      
      // Should not show sign in/register buttons when user is authenticated
      const signInButtons = screen.queryAllByText('Sign In');
      const registerButtons = screen.queryAllByText('Register');
      
      // Should not appear anywhere when user is authenticated
      expect(signInButtons).toHaveLength(0);
      expect(registerButtons).toHaveLength(0);
    });

    it('shows book session button in CTA section', () => {
      renderHomePage();
      
      expect(screen.getByText('Book a Session')).toBeInTheDocument();
    });

    it('navigates to dashboard when dashboard button is clicked', () => {
      renderHomePage();
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      fireEvent.click(dashboardButton);
      
      expect(window.location.pathname).toBe('/dashboard');
    });

    it('navigates to schedule when book session is clicked', () => {
      renderHomePage();
      
      const bookSessionButton = screen.getByText('Book a Session');
      fireEvent.click(bookSessionButton);
      
      expect(window.location.pathname).toBe('/schedule');
    });
  });

  it('displays call to action section', () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderHomePage();
    
    expect(screen.getByText('Ready to start your training?')).toBeInTheDocument();
    expect(screen.getByText(/Join our program today and transform your strength/i)).toBeInTheDocument();
  });
});
