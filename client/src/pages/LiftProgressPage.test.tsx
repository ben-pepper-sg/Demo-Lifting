import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LiftProgressPage from './LiftProgressPage';
import { workoutService } from '../services/api';
import { AuthProvider } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', firstName: 'Test', lastName: 'User' },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart" />,
}));

// Mock the API call
jest.mock('../services/api', () => ({
  workoutService: {
    getLiftProgression: jest.fn(),
  },
}));

describe('LiftProgressPage', () => {
  const mockLiftData = {
    workouts: [
      {
        id: '1',
        date: '2023-01-01T00:00:00.000Z',
        liftType: 'BENCH',
        weight: 200,
        reps: 5,
        sets: 3,
        notes: 'Test notes',
      },
    ],
    timeframe: '3M',
    liftType: 'BENCH',
    startDate: '2022-10-01T00:00:00.000Z',
    endDate: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    (workoutService.getLiftProgression as jest.Mock).mockResolvedValue({
      data: mockLiftData,
    });
  });

  it('renders the lift progression page with chart and history', async () => {
    render(<LiftProgressPage />);
    
    // Check that the page title is rendered
    expect(screen.getByText(/Lift Progression Tracker/i)).toBeInTheDocument();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(workoutService.getLiftProgression).toHaveBeenCalled();
    });
    
    // Check that the workout history is displayed
    await waitFor(() => {
      expect(screen.getByText(/Recent Workout History/i)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument(); // Weight
      expect(screen.getByText(/5/)).toBeInTheDocument(); // Reps
      expect(screen.getByText(/3/)).toBeInTheDocument(); // Sets
      expect(screen.getByText(/Test notes/)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', async () => {
    // Delay the API response
    (workoutService.getLiftProgression as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockLiftData }), 100))
    );
    
    render(<LiftProgressPage />);
    
    // Check for loading state
    expect(screen.getByText(/Loading workout data/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading workout data/i)).not.toBeInTheDocument();
    });
  });

  it('handles errors when fetching data', async () => {
    // Mock an API error
    (workoutService.getLiftProgression as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Failed to load data' } }
    });
    
    render(<LiftProgressPage />);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    });
  });
});