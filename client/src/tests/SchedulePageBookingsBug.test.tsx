import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SchedulePage from '../pages/SchedulePage';
import { scheduleService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', firstName: 'Test', lastName: 'User' },
    isAuthenticated: true,
  }),
}));

// Mock the service
jest.mock('../services/api', () => ({
  scheduleService: {
    getAllSchedules: jest.fn(),
    bookTimeSlot: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));

describe('SchedulePage Bookings Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle schedule with undefined bookings property without crashing', async () => {
    // Mock a schedule with undefined bookings property (simulating API response issue)
    const mockSchedules = [
      {
        id: 'schedule-1',
        date: '2025-06-20T09:00:00.000Z',
        time: '09:00',
        capacity: 8,
        currentParticipants: 3,
        workoutType: 'UPPER',
        coach: {
          id: 'coach-1',
          firstName: 'Coach',
          lastName: 'One',
        },
        // bookings property is undefined (this causes the TypeError)
        bookings: undefined,
      },
    ];
    
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValue({
      data: { schedules: mockSchedules },
    });
    
    // This should not throw an error
    render(<SchedulePage />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });
    
    // The page should still render with the schedule
    expect(screen.getByText('Class Schedule')).toBeInTheDocument();
    expect(screen.getByText('Thursday, Jun 19')).toBeInTheDocument();
  });

  it('should handle schedule with null bookings property without crashing', async () => {
    // Mock a schedule with null bookings property (simulating API response issue)
    const mockSchedules = [
      {
        id: 'schedule-2',
        date: '2025-06-20T09:00:00.000Z',
        time: '09:00',
        capacity: 8,
        currentParticipants: 3,
        workoutType: 'UPPER',
        coach: {
          id: 'coach-1',
          firstName: 'Coach',
          lastName: 'One',
        },
        // bookings property is null (this causes the TypeError)
        bookings: null,
      },
    ];
    
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValue({
      data: { schedules: mockSchedules },
    });
    
    // This should not throw an error
    render(<SchedulePage />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });
    
    // The page should still render with the schedule
    expect(screen.getByText('Class Schedule')).toBeInTheDocument();
    expect(screen.getByText('Thursday, Jun 19')).toBeInTheDocument();
  });
});
