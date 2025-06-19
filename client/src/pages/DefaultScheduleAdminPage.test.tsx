import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DefaultScheduleAdminPage from './DefaultScheduleAdminPage';
import { useAuth } from '../hooks/useAuth';
import { defaultScheduleService, userService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../services/api', () => ({
  defaultScheduleService: {
    getAllDefaultSchedules: jest.fn(),
    upsertDefaultSchedule: jest.fn(),
    deleteDefaultSchedule: jest.fn(),
  },
  userService: {
    getAllUsers: jest.fn(),
  },
}));

// Mock AdminNavigation component
jest.mock('../components/admin/AdminNavigation', () => ({
  default: () => <div data-testid="admin-navigation">Admin Navigation</div>,
}));

describe('DefaultScheduleAdminPage', () => {
  const mockUser = {
    id: 'admin1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockCoaches = [
    {
      id: 'coach1',
      firstName: 'Coach',
      lastName: 'Smith',
      role: 'COACH',
    },
    {
      id: 'admin1',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  ];

  const mockDefaultSchedules = [
    {
      id: 'default1',
      dayOfWeek: 1, // Monday
      time: '16:00',
      capacity: 8,
      workoutType: 'UPPER',
      isActive: true,
      coachId: 'coach1',
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
      isActive: false,
      coachId: 'admin1',
      coach: {
        id: 'admin1',
        firstName: 'Admin',
        lastName: 'User',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (defaultScheduleService.getAllDefaultSchedules as jest.Mock).mockResolvedValue({
      data: { defaultSchedules: mockDefaultSchedules },
    });
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      data: { users: mockCoaches },
    });
    
    // Mock window.confirm
    window.confirm = jest.fn();
  });

  const renderDefaultScheduleAdminPage = () => {
    return render(
      <BrowserRouter>
        <DefaultScheduleAdminPage />
      </BrowserRouter>
    );
  };

  it('renders page heading and admin navigation', async () => {
    renderDefaultScheduleAdminPage();
    
    expect(screen.getByRole('heading', { name: /manage default schedule/i })).toBeInTheDocument();
    expect(screen.getByTestId('admin-navigation')).toBeInTheDocument();
  });

  it('fetches and displays default schedules and coaches', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(defaultScheduleService.getAllDefaultSchedules).toHaveBeenCalled();
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('4:00 PM')).toBeInTheDocument();
    expect(screen.getByText('5:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Coach Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('displays form for creating new schedule', () => {
    renderDefaultScheduleAdminPage();
    
    expect(screen.getByText('Create Default Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText(/day of week/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/workout type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/coach/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
  });

  it('displays schedule table with proper data', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('Upper')).toBeInTheDocument();
    expect(screen.getByText('Lower')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('handles form submission for new schedule', async () => {
    (defaultScheduleService.upsertDefaultSchedule as jest.Mock).mockResolvedValueOnce({});
    
    renderDefaultScheduleAdminPage();
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/day of week/i), {
      target: { value: '3' }, // Wednesday
    });
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '18:00' },
    });
    fireEvent.change(screen.getByLabelText(/workout type/i), {
      target: { value: 'LOWER' },
    });
    fireEvent.change(screen.getByLabelText(/capacity/i), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/coach/i), {
      target: { value: 'coach1' },
    });
    
    fireEvent.click(screen.getByText('Create Schedule'));
    
    await waitFor(() => {
      expect(defaultScheduleService.upsertDefaultSchedule).toHaveBeenCalledWith({
        id: '',
        dayOfWeek: 3,
        time: '18:00',
        capacity: 10,
        workoutType: 'LOWER',
        coachId: 'coach1',
        isActive: true,
      });
      expect(screen.getByText('Default schedule created successfully!')).toBeInTheDocument();
    });
  });

  it('uses current admin user as default coach when none selected', async () => {
    (defaultScheduleService.upsertDefaultSchedule as jest.Mock).mockResolvedValueOnce({});
    
    renderDefaultScheduleAdminPage();
    
    // Don't select a coach (leave empty)
    fireEvent.click(screen.getByText('Create Schedule'));
    
    await waitFor(() => {
      expect(defaultScheduleService.upsertDefaultSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          coachId: 'admin1', // Should use current user's ID
        })
      );
    });
  });

  it('enters edit mode when edit button is clicked', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    // Click first edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Edit Default Schedule')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
    expect(screen.getByText('Update Schedule')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles schedule update', async () => {
    (defaultScheduleService.upsertDefaultSchedule as jest.Mock).mockResolvedValueOnce({});
    
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Update capacity
    fireEvent.change(screen.getByLabelText(/capacity/i), {
      target: { value: '10' },
    });
    
    fireEvent.click(screen.getByText('Update Schedule'));
    
    await waitFor(() => {
      expect(defaultScheduleService.upsertDefaultSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'default1',
          capacity: 10,
        })
      );
      expect(screen.getByText('Default schedule updated successfully!')).toBeInTheDocument();
    });
  });

  it('cancels edit mode', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Edit Default Schedule')).toBeInTheDocument();
    
    // Cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.getByText('Create Default Schedule')).toBeInTheDocument();
    expect(screen.queryByText('Edit Default Schedule')).not.toBeInTheDocument();
  });

  it('handles schedule deletion with confirmation', async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    (defaultScheduleService.deleteDefaultSchedule as jest.Mock).mockResolvedValueOnce({});
    
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    // Click first delete button
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this default schedule?'
    );
    
    await waitFor(() => {
      expect(defaultScheduleService.deleteDefaultSchedule).toHaveBeenCalledWith('default1');
      expect(screen.getByText('Default schedule deleted successfully!')).toBeInTheDocument();
    });
  });

  it('cancels deletion when not confirmed', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(defaultScheduleService.deleteDefaultSchedule).not.toHaveBeenCalled();
  });

  it('handles form validation errors', async () => {
    const errorMessage = 'Schedule already exists for this time slot';
    (defaultScheduleService.upsertDefaultSchedule as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });
    
    renderDefaultScheduleAdminPage();
    
    fireEvent.click(screen.getByText('Create Schedule'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles delete errors', async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    const errorMessage = 'Cannot delete schedule with active bookings';
    (defaultScheduleService.deleteDefaultSchedule as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });
    
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays no schedules message when empty', async () => {
    (defaultScheduleService.getAllDefaultSchedules as jest.Mock).mockResolvedValueOnce({
      data: { defaultSchedules: [] },
    });

    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('No default schedules configured.')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    renderDefaultScheduleAdminPage();
    
    expect(screen.getByText('Loading schedules...')).toBeInTheDocument();
  });

  it('displays coach options in select dropdown', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Coach Smith')).toBeInTheDocument();
    });

    // Check coach options in form
    const coachSelect = screen.getByLabelText(/coach/i);
    expect(coachSelect).toBeInTheDocument();
    
    // Check that coaches are loaded
    expect(userService.getAllUsers).toHaveBeenCalled();
  });

  it('formats time display correctly', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('5:00 PM')).toBeInTheDocument();
    });
  });

  it('shows different workout type badges', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Upper')).toBeInTheDocument();
      expect(screen.getByText('Lower')).toBeInTheDocument();
    });
  });

  it('shows active/inactive status badges', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('sorts schedules by day and time', async () => {
    renderDefaultScheduleAdminPage();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });

    // Check that Monday comes before Tuesday in the table
    const rows = screen.getAllByRole('row');
    const mondayRowIndex = rows.findIndex(row => row.textContent?.includes('Monday'));
    const tuesdayRowIndex = rows.findIndex(row => row.textContent?.includes('Tuesday'));
    
    expect(mondayRowIndex).toBeLessThan(tuesdayRowIndex);
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderDefaultScheduleAdminPage();
      
      expect(screen.getByLabelText(/day of week/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/workout type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/coach/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
    });

    it('has proper button states during submission', async () => {
      (defaultScheduleService.upsertDefaultSchedule as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderDefaultScheduleAdminPage();
      
      const submitButton = screen.getByText('Create Schedule');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('has proper table structure', async () => {
      renderDefaultScheduleAdminPage();
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const headers = screen.getAllByRole('columnheader');
        expect(headers).toHaveLength(6); // Day, Time, Type, Coach, Status, Actions
      });
    });
  });
});
