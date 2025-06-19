import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddUserToClassModal from '../../components/admin/AddUserToClassModal';
import { scheduleService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  scheduleService: {
    adminAddUserToClass: jest.fn(),
  },
}));

describe('AddUserToClassModal Component', () => {
  const mockSchedule = {
    id: 'schedule-123',
    date: '2025-05-10T00:00:00.000Z',
    time: '16:00',
    workoutType: 'UPPER',
    capacity: 8,
    currentParticipants: 3,
    bookings: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
  };
  
  const mockUsers = [
    { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    { id: 'user-3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com' },
    { id: 'user-4', firstName: 'Alice', lastName: 'Williams', email: 'alice@example.com' },
    { id: 'user-5', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com' },
  ];
  
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the modal with schedule information', () => {
    render(
      <AddUserToClassModal
        schedule={mockSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Check that modal title and schedule info is displayed
    expect(screen.getByText('Add User to Class')).toBeInTheDocument();
    expect(screen.getByText(/UPPER/)).toBeInTheDocument();
    expect(screen.getByText(/Current Participants: 3\/8/)).toBeInTheDocument();
  });
  
  test('displays only available users in the dropdown', () => {
    render(
      <AddUserToClassModal
        schedule={mockSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Only user-4 and user-5 should be available (not already booked)
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
    
    // Open the dropdown
    fireEvent.click(selectElement);
    
    // Select should have 3 options (default + 2 available users)
    expect(selectElement.children.length).toBe(3);
    
    // Check that booked users are not in the dropdown
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Check that available users are in the dropdown
    expect(screen.getByText(/Alice Williams/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie Brown/)).toBeInTheDocument();
  });
  
  test('submits the form correctly', async () => {
    (scheduleService.adminAddUserToClass as jest.Mock).mockResolvedValue({
      data: { message: 'User added to class successfully' },
    });
    
    render(
      <AddUserToClassModal
        schedule={mockSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Select a user
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'user-4' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Add User to Class/i });
    fireEvent.click(submitButton);
    
    // Check that the API was called with correct parameters
    await waitFor(() => {
      expect(scheduleService.adminAddUserToClass).toHaveBeenCalledWith({
        scheduleId: 'schedule-123',
        userId: 'user-4',
        workoutType: 'UPPER',
      });
    });
    
    // Check that success message is displayed
    await waitFor(() => {
      expect(screen.getByText('User added to class successfully')).toBeInTheDocument();
    });
    
    // Check that onSuccess and onClose are called after timeout
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
  
  test('handles API errors correctly', async () => {
    (scheduleService.adminAddUserToClass as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Failed to add user to class' } },
    });
    
    render(
      <AddUserToClassModal
        schedule={mockSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Select a user
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'user-4' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Add User to Class/i });
    fireEvent.click(submitButton);
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to add user to class')).toBeInTheDocument();
    });
    
    // onSuccess and onClose should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  test('closes the modal when cancel button is clicked', () => {
    render(
      <AddUserToClassModal
        schedule={mockSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('displays a message when no users are available', () => {
    // Create a schedule where all users are already booked
    const fullSchedule = {
      ...mockSchedule,
      bookings: mockUsers.map(user => ({ userId: user.id })),
    };
    
    render(
      <AddUserToClassModal
        schedule={fullSchedule}
        users={mockUsers}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    
    expect(screen.getByText('All users are already booked for this class or no users available.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});