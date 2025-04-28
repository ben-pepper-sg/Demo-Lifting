import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClassViewPage from '../pages/ClassViewPage';
import { scheduleService } from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  scheduleService: {
    getClassDetails: jest.fn(),
  }
}));

describe('ClassViewPage', () => {
  const mockClassDetails = {
    id: 'test-id',
    date: '2025-04-28T00:00:00Z',
    time: '17:00',
    workoutType: 'UPPER',
    participants: [
      {
        userId: 'user1',
        firstName: 'John',
        lastInitial: 'D',
        weights: {
          bench: 225,
          ohp: 135,
        },
      },
      {
        userId: 'user2',
        firstName: 'Jane',
        lastInitial: 'S',
        weights: {
          bench: 115,
          ohp: 75,
        },
      },
    ],
    scheme: {
      sets: [5, 5, 5, 5, 5],
      reps: [5, 5, 5, 5, 5],
      percentages: [65, 75, 85, 85, 85],
      restTime: 60,
    },
    supplementalWorkouts: [
      {
        id: 'suppl1',
        name: 'Bicep Curl',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Curl with dumbbells',
      },
      {
        id: 'suppl2',
        name: 'Tricep Extension',
        category: 'UPPER',
        bodyPart: 'TRICEPS',
        description: 'Extend with dumbbells',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current time for consistent testing
    jest.useFakeTimers().setSystemTime(new Date('2025-04-28T16:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders loading state initially', () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValue({ data: {} });
    
    render(<ClassViewPage />);
    
    expect(screen.getByText('Loading class details...')).toBeInTheDocument();
  });

  test('renders class details with participants and supplemental workouts', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockResolvedValue({ 
      data: { class: mockClassDetails } 
    });
    
    render(<ClassViewPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading class details...')).not.toBeInTheDocument();
    });
    
    // Check main class details
    expect(screen.getByText('Upper Body Day')).toBeInTheDocument();
    expect(screen.getByText('5:00 PM', { exact: false })).toBeInTheDocument();
    
    // Check rep scheme
    expect(screen.getByText('5, 5, 5, 5, 5')).toBeInTheDocument();
    expect(screen.getByText('65%, 75%, 85%, 85%, 85%')).toBeInTheDocument();
    
    // Check participants
    expect(screen.getByText('John D.')).toBeInTheDocument();
    expect(screen.getByText('Jane S.')).toBeInTheDocument();
    expect(screen.getByText('225 lbs')).toBeInTheDocument();
    expect(screen.getByText('135 lbs')).toBeInTheDocument();
    
    // Check supplemental workouts
    expect(screen.getByText("This Week's Supplemental Workouts")).toBeInTheDocument();
    expect(screen.getByText('Bicep Curl')).toBeInTheDocument();
    expect(screen.getByText('Tricep Extension')).toBeInTheDocument();
    expect(screen.getByText('BICEPS')).toBeInTheDocument();
    expect(screen.getByText('TRICEPS')).toBeInTheDocument();
    expect(screen.getByText('Curl with dumbbells')).toBeInTheDocument();
    expect(screen.getByText('Extend with dumbbells')).toBeInTheDocument();
  });

  test('renders no class message when no class is available', async () => {
    (scheduleService.getClassDetails as jest.Mock).mockRejectedValue({
      response: { status: 404 }
    });
    
    render(<ClassViewPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading class details...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('No Class Currently in Session')).toBeInTheDocument();
  });
});