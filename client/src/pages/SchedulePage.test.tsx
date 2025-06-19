import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SchedulePage from './SchedulePage';
import { useAuth } from '../hooks/useAuth';
import { scheduleService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the API service
jest.mock('../services/api', () => ({
  scheduleService: {
    getAllSchedules: jest.fn(),
    bookTimeSlot: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));

// Mock date utils
jest.mock('../utils/dateUtils', () => ({
  formatDate: jest.fn((dateString, options) => {
    const date = new Date(dateString);
    if (options?.weekday && options?.month && options?.day) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString();
  }),
}));

describe('SchedulePage', () => {
  const mockUser = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'USER',
  };

  const mockSchedules = [
    {
      id: 'schedule1',
      date: '2023-12-04T00:00:00Z', // Monday
      time: '16:00',
      capacity: 8,
      currentParticipants: 2,
      workoutType: 'UPPER',
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
      bookings: [],
    },
    {
      id: 'schedule2',
      date: '2023-12-04T00:00:00Z', // Monday
      time: '17:00',
      capacity: 8,
      currentParticipants: 8, // Full
      workoutType: 'UPPER',
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
      bookings: [],
    },
    {
      id: 'schedule3',
      date: '2023-12-08T00:00:00Z', // Friday
      time: '16:00',
      capacity: 8,
      currentParticipants: 3,
      workoutType: 'UPPER',
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
      bookings: [],
    },
  ];

  const mockBookedSchedule = {
    ...mockSchedules[0],
    bookings: [{ user: { id: 'user1' } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValue({
      data: { schedules: mockSchedules },
    });
  });

  const renderSchedulePage = () => {
    return render(
      <BrowserRouter>
        <SchedulePage />
      </BrowserRouter>
    );
  };

  it('renders page heading and filter section', async () => {
    renderSchedulePage();
    
    expect(screen.getByRole('heading', { name: /class schedule/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update schedule/i })).toBeInTheDocument();
  });

  it('fetches and displays schedules on mount', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(scheduleService.getAllSchedules).toHaveBeenCalled();
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('16:00 - Upper Body')).toBeInTheDocument();
    expect(screen.getByText('17:00 - Upper Body')).toBeInTheDocument();
    expect(screen.getByText('Coach: Coach Smith')).toBeInTheDocument();
  });

  it('groups schedules by date', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });

    // Should see Monday schedules grouped together
    const mondaySchedules = screen.getAllByText(/coach: coach smith/i);
    expect(mondaySchedules.length).toBeGreaterThan(0);
  });

  it('handles date filter changes', async () => {
    renderSchedulePage();
    
    const dateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(dateInput, { target: { value: '2023-12-10' } });
    
    const updateButton = screen.getByRole('button', { name: /update schedule/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(scheduleService.getAllSchedules).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2023-12-10',
          endDate: '2023-12-17',
        })
      );
    });
  });

  it('displays schedule capacity information', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('2/8 spots')).toBeInTheDocument();
      expect(screen.getByText('8/8 spots')).toBeInTheDocument();
    });
  });

  it('shows different buttons for available vs full classes', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
      expect(screen.getByText('Class Full')).toBeInTheDocument();
    });

    const fullClassButton = screen.getByText('Class Full');
    expect(fullClassButton).toBeDisabled();
  });

  it('handles successful booking for weekday classes', async () => {
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValueOnce({});
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    const bookButton = screen.getByText('Book Session');
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith('schedule1');
      expect(screen.getByText('Session booked successfully!')).toBeInTheDocument();
    });
  });

  it('shows workout type modal for Friday/Saturday classes', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book Session')).toHaveLength(2); // Monday has 2 sessions, Friday has 1
    });

    // Click on Friday class (schedule3) - it's the last one
    const bookButtons = screen.getAllByText('Book Session');
    const fridayBookButton = bookButtons[bookButtons.length - 1]; // Last available button

    fireEvent.click(fridayBookButton);

    expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
    expect(screen.getByText('Friday and Saturday are flexible workout days')).toBeInTheDocument();
    expect(screen.getByLabelText('Upper Body')).toBeInTheDocument();
    expect(screen.getByLabelText('Lower Body')).toBeInTheDocument();
  });

  it('handles workout type selection for Friday/Saturday', async () => {
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValueOnce({});
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    // Open modal for Friday class
    const bookButtons = screen.getAllByText('Book Session');
    fireEvent.click(bookButtons[1]); // Assuming Friday is second

    await waitFor(() => {
      expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
    });

    // Select Lower Body
    fireEvent.click(screen.getByLabelText('Lower Body'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith('schedule3', 'LOWER');
      expect(screen.getByText('Session booked successfully!')).toBeInTheDocument();
    });
  });

  it('allows canceling workout type selection', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    // Open modal
    const bookButtons = screen.getAllByText('Book Session');
    fireEvent.click(bookButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
    });

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Select Workout Type')).not.toBeInTheDocument();
    expect(scheduleService.bookTimeSlot).not.toHaveBeenCalled();
  });

  it('handles booking errors', async () => {
    const errorMessage = 'Failed to book session';
    (scheduleService.bookTimeSlot as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows cancel booking button for booked sessions', async () => {
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValueOnce({
      data: { schedules: [mockBookedSchedule] },
    });

    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    });
  });

  it('handles cancel booking', async () => {
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValueOnce({
      data: { schedules: [mockBookedSchedule] },
    });
    (scheduleService.cancelBooking as jest.Mock).mockResolvedValueOnce({});

    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel Booking'));

    await waitFor(() => {
      expect(scheduleService.cancelBooking).toHaveBeenCalledWith('schedule1');
      expect(screen.getByText('Booking cancelled successfully!')).toBeInTheDocument();
    });
  });

  it('displays no schedules message when empty', async () => {
    (scheduleService.getAllSchedules as jest.Mock).mockResolvedValueOnce({
      data: { schedules: [] },
    });

    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('No schedules available for the selected date range.')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    const errorMessage = 'Failed to fetch schedules';
    (scheduleService.getAllSchedules as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderSchedulePage();
    
    expect(screen.getByText('Loading schedule...')).toBeInTheDocument();
  });

  it('displays workout type badges correctly', async () => {
    renderSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Upper Body')).toHaveLength(3); // All schedules are upper body
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', async () => {
      renderSchedulePage();
      
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('has proper button states during loading', async () => {
      (scheduleService.bookTimeSlot as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderSchedulePage();
      
      await waitFor(() => {
        expect(screen.getByText('Book Session')).toBeInTheDocument();
      });

      const bookButton = screen.getByText('Book Session');
      fireEvent.click(bookButton);

      expect(bookButton).toBeDisabled();
    });
  });
});
