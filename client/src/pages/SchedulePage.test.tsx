import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import SchedulePage from './SchedulePage';
import { scheduleService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', firstName: 'Test', lastName: 'User' },
    isAuthenticated: true,
  }),
}));

// Mock Sentry to avoid actual monitoring during tests
jest.mock('@sentry/react', () => {
  const original = jest.requireActual('@sentry/react');
  return {
    ...original,
    startTransaction: jest.fn(() => ({
      setTag: jest.fn(),
      setStatus: jest.fn(),
      finish: jest.fn(),
      startChild: jest.fn(() => ({
        finish: jest.fn(),
      })),
    })),
    captureException: jest.fn(),
    setContext: jest.fn(),
    withProfiler: (component) => component,
  };
});

// Mock the service
jest.mock('../services/api', () => ({
  scheduleService: {
    getAllSchedules: jest.fn(),
    bookTimeSlot: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));

describe('SchedulePage', () => {
  // Sample schedule data
  const fridayDate = new Date();
  while (fridayDate.getDay() !== 5) {
    fridayDate.setDate(fridayDate.getDate() + 1);
  }
  
  const tuesdayDate = new Date();
  while (tuesdayDate.getDay() !== 2) {
    tuesdayDate.setDate(tuesdayDate.getDate() + 1);
  }
  
  const mockSchedules = [
    {
      id: 'friday-schedule',
      date: fridayDate.toISOString(),
      time: '09:00',
      capacity: 8,
      currentParticipants: 3,
      workoutType: 'UPPER',
      coach: {
        id: 'coach-1',
        firstName: 'Coach',
        lastName: 'One',
      },
      bookings: [],
    },
    {
      id: 'tuesday-schedule',
      date: tuesdayDate.toISOString(),
      time: '10:00',
      capacity: 8,
      currentParticipants: 4,
      workoutType: 'LOWER',
      coach: {
        id: 'coach-2',
        firstName: 'Coach',
        lastName: 'Two',
      },
      bookings: [],
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response for getAllSchedules
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValue({
      data: { schedules: mockSchedules },
    });
    
    // Default success response for booking
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValue({
      data: {
        message: 'Time slot booked successfully',
        booking: {
          id: 'booking-1',
          scheduleId: 'test-schedule',
          userId: 'test-user-id',
        },
      },
    });
  });

  it('renders the schedule page with schedules', async () => {
    render(<SchedulePage />);
    
    // Check initial loading state
    expect(screen.getByText('Loading schedule...')).toBeInTheDocument();
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(scheduleService.getAllSchedules).toHaveBeenCalled();
    });
    
    // Check that Friday and Tuesday schedules are displayed
    await waitFor(() => {
      expect(screen.getByText('Friday,')).toBeInTheDocument();
      expect(screen.getByText('Tuesday,')).toBeInTheDocument();
    });
  });

  it('shows workout type selection modal for Friday booking', async () => {
    // Mock the Friday booking to require workout type
    (scheduleService.bookTimeSlot as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Please select a workout type',
          requiresWorkoutType: true,
          dayOfWeek: 5,
        },
        status: 400,
      },
    });
    
    render(<SchedulePage />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });
    
    // Find the Friday booking button (first schedule in our mock)
    const bookButtons = screen.getAllByText('Book Session');
    userEvent.click(bookButtons[0]);
    
    // Check that modal appears
    await waitFor(() => {
      expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
      expect(screen.getByText('Friday and Saturday are flexible workout days')).toBeInTheDocument();
    });
    
    // Select Lower Body and confirm
    const lowerBodyOption = screen.getByLabelText('Lower Body');
    userEvent.click(lowerBodyOption);
    
    // Submit the form
    userEvent.click(screen.getByText('Confirm'));
    
    // Check that bookTimeSlot was called with the workout type
    await waitFor(() => {
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith('friday-schedule', 'LOWER');
    });
  });

  it('books a weekday session without workout type selection', async () => {
    render(<SchedulePage />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });
    
    // Find the Tuesday booking button (second schedule in our mock)
    const bookButtons = screen.getAllByText('Book Session');
    userEvent.click(bookButtons[1]);
    
    // Check that bookTimeSlot was called without workout type
    await waitFor(() => {
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith('tuesday-schedule');
      expect(screen.queryByText('Select Workout Type')).not.toBeInTheDocument();
    });
  });

  it('handles errors when booking a session', async () => {
    // Mock a generic error
    (scheduleService.bookTimeSlot as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Failed to book session',
        },
      },
    });
    
    render(<SchedulePage />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });
    
    // Try to book a session
    const bookButtons = screen.getAllByText('Book Session');
    userEvent.click(bookButtons[1]); // Tuesday session
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to book session')).toBeInTheDocument();
    });
  });
});