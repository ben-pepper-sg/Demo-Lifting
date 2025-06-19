import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DefaultSchedulePage from './DefaultSchedulePage';
import { useAuth } from '../hooks/useAuth';
import { defaultScheduleService, scheduleService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../services/api', () => ({
  defaultScheduleService: {
    getAllDefaultSchedules: jest.fn(),
    createScheduleFromDefault: jest.fn(),
  },
  scheduleService: {
    bookTimeSlot: jest.fn(),
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

describe('DefaultSchedulePage', () => {
  const mockUser = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'USER',
  };

  const mockDefaultSchedules = [
    {
      id: 'default1',
      dayOfWeek: 1, // Monday
      time: '16:00',
      capacity: 8,
      workoutType: 'UPPER',
      isActive: true,
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
    },
    {
      id: 'default2',
      dayOfWeek: 2, // Tuesday
      time: '17:00',
      capacity: 8,
      workoutType: 'LOWER',
      isActive: true,
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
    },
    {
      id: 'default3',
      dayOfWeek: 5, // Friday
      time: '16:00',
      capacity: 8,
      workoutType: 'UPPER',
      isActive: true,
      coach: {
        id: 'coach1',
        firstName: 'Coach',
        lastName: 'Smith',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (defaultScheduleService.getAllDefaultSchedules as jest.Mock).mockResolvedValue({
      data: { defaultSchedules: mockDefaultSchedules },
    });
  });

  const renderDefaultSchedulePage = () => {
    return render(
      <BrowserRouter>
        <DefaultSchedulePage />
      </BrowserRouter>
    );
  };

  it('renders page heading and date selector', async () => {
    renderDefaultSchedulePage();
    
    expect(screen.getByRole('heading', { name: /class schedule/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/starting from/i)).toBeInTheDocument();
  });

  it('shows new timeslot notification', () => {
    renderDefaultSchedulePage();
    
    expect(screen.getByText('New Morning Classes Added!')).toBeInTheDocument();
    expect(screen.getByText(/New 8:00 AM and 9:00 AM classes/i)).toBeInTheDocument();
  });

  it('can dismiss the notification', () => {
    renderDefaultSchedulePage();
    
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    
    expect(screen.queryByText('New Morning Classes Added!')).not.toBeInTheDocument();
  });

  it('fetches and displays default schedules', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(defaultScheduleService.getAllDefaultSchedules).toHaveBeenCalled();
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('4:00 PM - Upper Body')).toBeInTheDocument();
    expect(screen.getByText('5:00 PM - Lower Body')).toBeInTheDocument();
  });

  it('displays schedules grouped by day of week', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });

    // Check that schedules are grouped under day headings
    const mondaySection = screen.getByText('Monday').closest('div');
    expect(mondaySection).toBeInTheDocument();
    
    const tuesdaySection = screen.getByText('Tuesday').closest('div');
    expect(tuesdaySection).toBeInTheDocument();
  });

  it('shows capacity information', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Capacity: 8 spots')).toHaveLength(3);
    });
  });

  it('displays workout type badges', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Fixed')).toBeInTheDocument(); // Monday/Tuesday
      expect(screen.getByText('Flexible')).toBeInTheDocument(); // Friday
    });
  });

  it('handles booking for weekday classes', async () => {
    (defaultScheduleService.createScheduleFromDefault as jest.Mock).mockResolvedValueOnce({
      data: { schedule: { id: 'schedule1' } },
    });
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValueOnce({});

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('Book This Time')).toBeInTheDocument();
    });

    // Book Monday class
    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[0]);

    await waitFor(() => {
      expect(defaultScheduleService.createScheduleFromDefault).toHaveBeenCalledWith({
        defaultScheduleId: 'default1',
        date: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
      });
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith('schedule1', undefined);
      expect(screen.getByText('Session booked successfully!')).toBeInTheDocument();
    });
  });

  it('shows workout type modal for Friday/Saturday classes', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    // Click on Friday class
    const bookButtons = screen.getAllByText('Book This Time');
    const fridayButton = bookButtons.find(button => {
      const card = button.closest('[class*="card"]');
      return card?.textContent?.includes('Friday');
    });

    fireEvent.click(fridayButton!);

    expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
    expect(screen.getByText('Friday and Saturday are flexible workout days')).toBeInTheDocument();
    expect(screen.getByLabelText('Upper Body')).toBeInTheDocument();
    expect(screen.getByLabelText('Lower Body')).toBeInTheDocument();
  });

  it('handles workout type selection for Friday/Saturday', async () => {
    (defaultScheduleService.createScheduleFromDefault as jest.Mock).mockResolvedValueOnce({
      data: { schedule: { id: 'schedule3' } },
    });
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValueOnce({});

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    // Click on Friday class to open modal
    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[2]); // Friday class

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

  it('can cancel workout type selection', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    // Open modal
    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[2]); // Friday class

    await waitFor(() => {
      expect(screen.getByText('Select Workout Type')).toBeInTheDocument();
    });

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Select Workout Type')).not.toBeInTheDocument();
    expect(scheduleService.bookTimeSlot).not.toHaveBeenCalled();
  });

  it('handles existing schedule conflict (409 error)', async () => {
    const existingScheduleId = 'existing-schedule';
    (defaultScheduleService.createScheduleFromDefault as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 409,
        data: { scheduleId: existingScheduleId },
      },
    });
    (scheduleService.bookTimeSlot as jest.Mock).mockResolvedValueOnce({});

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[0]);

    await waitFor(() => {
      expect(scheduleService.bookTimeSlot).toHaveBeenCalledWith(existingScheduleId, undefined);
      expect(screen.getByText('Session booked successfully!')).toBeInTheDocument();
    });
  });

  it('handles booking errors', async () => {
    const errorMessage = 'Failed to book session';
    (defaultScheduleService.createScheduleFromDefault as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('updates date filter', () => {
    renderDefaultSchedulePage();
    
    const dateInput = screen.getByLabelText(/starting from/i);
    fireEvent.change(dateInput, { target: { value: '2023-12-10' } });
    
    expect(dateInput).toHaveValue('2023-12-10');
  });

  it('displays no schedules message when empty', async () => {
    (defaultScheduleService.getAllDefaultSchedules as jest.Mock).mockResolvedValueOnce({
      data: { defaultSchedules: [] },
    });

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText('No default schedules available.')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    const errorMessage = 'Failed to fetch default schedules';
    (defaultScheduleService.getAllDefaultSchedules as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderDefaultSchedulePage();
    
    expect(screen.getByText('Loading schedule...')).toBeInTheDocument();
  });

  it('calculates next occurrence dates correctly', async () => {
    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
    });

    // Monday should be shown in the schedule headings 
    const headings = screen.getAllByText(/Monday/);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows booking loading state', async () => {
    (defaultScheduleService.createScheduleFromDefault as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderDefaultSchedulePage();
    
    await waitFor(() => {
      expect(screen.getAllByText('Book This Time')).toHaveLength(3);
    });

    const bookButtons = screen.getAllByText('Book This Time');
    fireEvent.click(bookButtons[0]);

    expect(screen.getByText('Booking...')).toBeInTheDocument();
    expect(screen.getByText('Booking...')).toBeDisabled();
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderDefaultSchedulePage();
      
      expect(screen.getByLabelText(/starting from/i)).toBeInTheDocument();
    });

    it('has proper button states', async () => {
      renderDefaultSchedulePage();
      
      await waitFor(() => {
        expect(screen.getAllByText('Book This Time')).toHaveLength(3);
      });
      
      const bookButtons = screen.getAllByText('Book This Time');
      bookButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('has dismissible notification with proper aria label', () => {
      renderDefaultSchedulePage();
      
      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
    });

    it('has proper modal accessibility', async () => {
      renderDefaultSchedulePage();
      
      await waitFor(() => {
        expect(screen.getAllByText('Book This Time')).toHaveLength(3);
      });

      // Open modal
      const bookButtons = screen.getAllByText('Book This Time');
      fireEvent.click(bookButtons[2]); // Friday class

      await waitFor(() => {
        const modal = screen.getByText('Select Workout Type').closest('[class*="fixed"]');
        expect(modal).toBeInTheDocument();
      });
    });
  });
});
