import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAuth } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('DashboardPage', () => {
  const mockUseAuth = useAuth as jest.Mock;

  const renderDashboardPage = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with authenticated user', () => {
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

    it('renders dashboard heading', () => {
      renderDashboardPage();
      
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('displays personalized welcome message', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    it('shows dashboard feature descriptions', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
      expect(screen.getByText('View your max lifts and today\'s workout scheme')).toBeInTheDocument();
      
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Book or view your upcoming classes')).toBeInTheDocument();
      
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
      expect(screen.getByText('Track your lifting progress over time')).toBeInTheDocument();
    });

    it('displays quick links section', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view profile & program/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /schedule classes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view progress/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /current class/i })).toBeInTheDocument();
    });

    it('has correct navigation links', () => {
      renderDashboardPage();
      
      expect(screen.getByRole('link', { name: /view profile & program/i })).toHaveAttribute('href', '/profile');
      expect(screen.getByRole('link', { name: /schedule classes/i })).toHaveAttribute('href', '/schedule');
      expect(screen.getByRole('link', { name: /view progress/i })).toHaveAttribute('href', '/progress');
      expect(screen.getByRole('link', { name: /current class/i })).toHaveAttribute('href', '/class');
    });

    it('shows today\'s focus section', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Today\'s Focus')).toBeInTheDocument();
      expect(screen.getByText('Check your profile to see your personalized workout for today.')).toBeInTheDocument();
    });

    it('displays workout type based on day logic', () => {
      renderDashboardPage();
      
      // Check that one of the workout types is displayed
      const isUpperDay = screen.queryByText('Upper Body Day');
      const isLowerDay = screen.queryByText('Lower Body Day');
      
      // Exactly one should be present
      expect(isUpperDay || isLowerDay).toBeTruthy();
      expect(isUpperDay && isLowerDay).toBeFalsy();
    });
  });

  describe('with different user names', () => {
    it('displays correct name for different users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'USER',
        },
      });

      renderDashboardPage();
      
      expect(screen.getByText('Welcome, Jane!')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
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

    it('has proper heading structure', () => {
      renderDashboardPage();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Dashboard');
      
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings).toHaveLength(3); // Welcome section, Quick Links, Today's Focus
    });

    it('has proper link accessibility', () => {
      renderDashboardPage();
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});
