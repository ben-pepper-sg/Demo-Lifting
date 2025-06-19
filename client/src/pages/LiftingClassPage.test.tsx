import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LiftingClassPage from './LiftingClassPage';
import { scheduleService } from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  scheduleService: {
    getClassDetails: jest.fn(),
  },
}));

// Mock the weight formatting utility
jest.mock('../utils/helpers', () => ({
  formatWeight: jest.fn((weight) => `${weight} lbs`),
}));

// Mock CSS import
jest.mock('../styles/LiftingClass.css', () => ({}));

// Mock URL search params
const mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams],
}));

describe('LiftingClassPage', () => {
  const mockClassDetails = {
    id: 'class1',
    date: '2023-12-04T17:00:00Z',
    time: '17:00',
    workoutType: 'UPPER',
    participants: [
      {
        userId: 'user1',
        firstName: 'John',
        lastInitial: 'D',
        weights: {
          bench: [185, 205, 225, 225, 225],
          ohp: [95, 105, 115, 115, 115],
        },
      },
      {
        userId: 'user2',
        firstName: 'Jane',
        lastInitial: 'S',
        weights: {
          bench: [85, 95, 105, 105, 105],
          ohp: [45, 50, 55, 55, 55],
        },
      },
    ],
    scheme: {
      sets: [5, 5, 5, 5, 5],
      reps: [5, 5, 5, 5, 5],
      percentages: [65, 75, 85, 85, 85],
      restTime: 180, // 3 minutes in seconds
    },
    supplementalWorkouts: [
      {
        id: 'upper1',
        name: 'Upper Body Workout A',
        category: 'UPPER',
        exercises: [
          {
            id: 'ex1',
            name: 'Dumbbell Rows',
            description: '3 sets of 12 reps',
          },
          {
            id: 'ex2',
            name: 'Lateral Raises',
            description: '3 sets of 15 reps',
          },
          {
            id: 'ex3',
            name: 'Tricep Dips',
            description: '3 sets of 10 reps',
          },
          {
            id: 'ex4',
            name: 'Bicep Curls',
            description: '3 sets of 12 reps',
          },
          {
            id: 'ex5',
            name: 'Face Pulls',
            description: '3 sets of 15 reps',
          },
        ],
      },
      {
        id: 'lower1',
        name: 'Lower Body Workout A',
        category: 'LOWER',
        exercises: [
          {
            id: 'ex6',
            name: 'Bulgarian Split Squats',
            description: '3 sets of 10 each leg',
          },
          {
            id: 'ex7',
            name: 'Romanian Deadlifts',
            description: '3 sets of 12 reps',
          },
          {
            id: 'ex8',
            name: 'Calf Raises',
            description: '3 sets of 15 reps',
          },
          {
            id: 'ex9',
            name: 'Walking Lunges',
            description: '3 sets of 20 steps',
          },
        ],
      },
    ],
  };

  const mockLowerClassDetails = {
    ...mockClassDetails,
    workoutType: 'LOWER',
    participants: [
      {
        userId: 'user1',
        firstName: 'John',
        lastInitial: 'D',
        weights: {
          squat: [185, 205, 225, 225, 225],
          deadlift: [225, 255, 285, 285, 285],
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchParams.delete('hour');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderLiftingClassPage = () => {
    return render(
      <BrowserRouter>
        <LiftingClassPage />
      </BrowserRouter>
    );
  };

  it('shows loading state initially', () => {
    (scheduleService.getClassDetails as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderLiftingClassPage();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays class details for upper body workout', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check rep scheme and rest period
    expect(screen.getByText('5-5-5-5-5')).toBeInTheDocument();
    expect(screen.getByText('3 minutes')).toBeInTheDocument();

    // Check participants
    expect(screen.getByText('John D.')).toBeInTheDocument();
    expect(screen.getByText('Jane S.')).toBeInTheDocument();

    // Check workout type headers
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Overhead Press')).toBeInTheDocument();

    // Check cell phone rule
    expect(screen.getByText('10 Burpees per use of cell phone')).toBeInTheDocument();
  });

  it('displays class details for lower body workout', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockLowerClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check workout type headers for lower body
    expect(screen.getByText('Back Squat / Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Deadlift / Overhead')).toBeInTheDocument();
  });

  it('displays participant weights correctly', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that weights are displayed (mocked formatWeight returns "X lbs")
    expect(screen.getByText('185 lbs')).toBeInTheDocument();
    expect(screen.getByText('225 lbs')).toBeInTheDocument();
    expect(screen.getByText('95 lbs')).toBeInTheDocument();
    expect(screen.getByText('115 lbs')).toBeInTheDocument();
  });

  it('displays supplemental workouts correctly', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check upper body supplemental workout (5 exercises)
    expect(screen.getByText('Upper Body Workout A')).toBeInTheDocument();
    expect(screen.getByText('Dumbbell Rows')).toBeInTheDocument();
    expect(screen.getByText('3 sets of 12 reps')).toBeInTheDocument();

    // Check lower body supplemental workout (4 exercises)
    expect(screen.getByText('Lower Body Workout A')).toBeInTheDocument();
    expect(screen.getByText('Bulgarian Split Squats')).toBeInTheDocument();
    expect(screen.getByText('3 sets of 10 each leg')).toBeInTheDocument();
  });

  it('displays weighted reps instruction', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.getByText('30 weighted reps / exercise / set')).toBeInTheDocument();
    });
  });

  it('shows no class message when class is not found', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockRejectedValueOnce({
      response: { status: 404 },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.getByText('No Class Currently in Session')).toBeInTheDocument();
      expect(screen.getByText('There is no class scheduled for the current hour.')).toBeInTheDocument();
    });
  });

  it('provides quick access buttons when no class is available', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockRejectedValueOnce({
      response: { status: 404 },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.getByText('View 8am Class')).toBeInTheDocument();
      expect(screen.getByText('View 9am Class')).toBeInTheDocument();
    });
  });

  it('shows error message for API failures', async () => {
    const errorMessage = 'Failed to fetch class details';
    (scheduleService.getClassDetails as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('uses hour parameter from URL when present', async () => {
    mockSearchParams.set('hour', '9');
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(scheduleService.getClassDetails).toHaveBeenCalledWith('/schedule/class?hour=9');
    });
  });

  it('uses default endpoint when no hour parameter', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(scheduleService.getClassDetails).toHaveBeenCalledWith('/schedule/class');
    });
  });

  it('handles participants without weights gracefully', async () => {
    const classWithoutWeights = {
      ...mockClassDetails,
      participants: [
        {
          userId: 'user1',
          firstName: 'John',
          lastInitial: 'D',
          weights: {}, // No weights
        },
      ],
    };

    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: classWithoutWeights },
    });

    renderLiftingClassPage();
    
    await waitFor(() => {
      expect(screen.getByText('John D.')).toBeInTheDocument();
      expect(screen.getAllByText('-')).toHaveLength(2); // Two columns should show "-"
    });
  });

  it('sets up auto-refresh intervals', async () => {
    const mockSetInterval = jest.spyOn(global, 'setInterval');
    const mockClearInterval = jest.spyOn(global, 'clearInterval');
    
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
      data: { class: mockClassDetails },
    });

    const { unmount } = renderLiftingClassPage();
    
    // Should set up interval for backup refresh
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
    
    unmount();
    
    // Should clean up intervals
    expect(mockClearInterval).toHaveBeenCalled();
    
    mockSetInterval.mockRestore();
    mockClearInterval.mockRestore();
  });

  describe('accessibility', () => {
    it('has proper heading structure', async () => {
      (scheduleService.getClassDetails as jest.Mock).mockResolvedValueOnce({
        data: { class: mockClassDetails },
      });

      renderLiftingClassPage();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Check that the page has proper structure
      expect(screen.getByText('Participants for the hour')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Overhead Press')).toBeInTheDocument();
    });

    it('provides meaningful error messages', async () => {
      (scheduleService.getClassDetails as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderLiftingClassPage();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch class details')).toBeInTheDocument();
      });
    });
  });
});
