import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SupplementalWorkoutAdminPage from '../pages/SupplementalWorkoutAdminPage';
import { supplementalWorkoutService } from '../services/api';
import { BrowserRouter } from 'react-router-dom';

// Mock the API service
jest.mock('../services/api', () => ({
  supplementalWorkoutService: {
    getAllSupplementalWorkouts: jest.fn(),
    createSupplementalWorkout: jest.fn(),
    updateSupplementalWorkout: jest.fn(),
    deleteSupplementalWorkout: jest.fn(),
  }
}));

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'ADMIN' },
  }),
}));

// Mock the admin navigation component
jest.mock('../components/admin/AdminNavigation', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-nav">Admin Navigation</div>,
}));

describe('SupplementalWorkoutAdminPage', () => {
  const mockWorkouts = [
    {
      id: '1',
      name: 'Bicep Curl',
      category: 'UPPER',
      bodyPart: 'BICEPS',
      description: 'Curl with dumbbells',
    },
    {
      id: '2',
      name: 'Squat',
      category: 'LOWER',
      bodyPart: 'QUADS',
      description: 'Basic squat',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (supplementalWorkoutService.getAllSupplementalWorkouts as jest.Mock).mockResolvedValue({
      data: { supplementalWorkouts: mockWorkouts },
    });
  });

  test('renders the page with form and workout list', async () => {
    render(
      <BrowserRouter>
        <SupplementalWorkoutAdminPage />
      </BrowserRouter>
    );

    // Check page title
    expect(screen.getByText('Manage Supplemental Workouts')).toBeInTheDocument();

    // Check form elements
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Body Part')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create workout/i })).toBeInTheDocument();

    // Wait for the workouts to load
    await waitFor(() => {
      expect(supplementalWorkoutService.getAllSupplementalWorkouts).toHaveBeenCalled();
    });

    // Check if workouts are displayed
    await waitFor(() => {
      expect(screen.getByText('Bicep Curl')).toBeInTheDocument();
      expect(screen.getByText('Squat')).toBeInTheDocument();
    });
  });

  test('allows creating a new supplemental workout', async () => {
    (supplementalWorkoutService.createSupplementalWorkout as jest.Mock).mockResolvedValue({
      data: {
        supplementalWorkout: {
          id: '3',
          name: 'New Workout',
          category: 'UPPER',
          bodyPart: 'SHOULDERS',
          description: 'New description',
        },
      },
    });

    render(
      <BrowserRouter>
        <SupplementalWorkoutAdminPage />
      </BrowserRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Workout' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'UPPER' } });
    fireEvent.change(screen.getByLabelText('Body Part'), { target: { value: 'SHOULDERS' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New description' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create workout/i }));

    // Check if the API was called with the right data
    await waitFor(() => {
      expect(supplementalWorkoutService.createSupplementalWorkout).toHaveBeenCalledWith({
        name: 'New Workout',
        category: 'UPPER',
        bodyPart: 'SHOULDERS',
        description: 'New description',
        id: '',
      });
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });

    // Check if workouts list was refreshed
    expect(supplementalWorkoutService.getAllSupplementalWorkouts).toHaveBeenCalledTimes(2);
  });

  test('allows editing a supplemental workout', async () => {
    (supplementalWorkoutService.updateSupplementalWorkout as jest.Mock).mockResolvedValue({
      data: {
        supplementalWorkout: {
          id: '1',
          name: 'Updated Workout',
          category: 'UPPER',
          bodyPart: 'BICEPS',
          description: 'Updated description',
        },
      },
    });

    render(
      <BrowserRouter>
        <SupplementalWorkoutAdminPage />
      </BrowserRouter>
    );

    // Wait for workouts to load
    await waitFor(() => {
      expect(screen.getByText('Bicep Curl')).toBeInTheDocument();
    });

    // Click edit button for the first workout
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Check if form is populated with workout data
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('Bicep Curl');
      expect(screen.getByLabelText('Description')).toHaveValue('Curl with dumbbells');
    });

    // Update the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Workout' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update workout/i }));

    // Check if the API was called with the right data
    await waitFor(() => {
      expect(supplementalWorkoutService.updateSupplementalWorkout).toHaveBeenCalledWith('1', {
        id: '1',
        name: 'Updated Workout',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Updated description',
      });
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  test('allows deleting a supplemental workout', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockImplementation(() => true);

    (supplementalWorkoutService.deleteSupplementalWorkout as jest.Mock).mockResolvedValue({
      data: { message: 'Supplemental workout deleted successfully' },
    });

    render(
      <BrowserRouter>
        <SupplementalWorkoutAdminPage />
      </BrowserRouter>
    );

    // Wait for workouts to load
    await waitFor(() => {
      expect(screen.getByText('Bicep Curl')).toBeInTheDocument();
    });

    // Click delete button for the first workout
    fireEvent.click(screen.getAllByText('Delete')[0]);

    // Check if the API was called with the right id
    await waitFor(() => {
      expect(supplementalWorkoutService.deleteSupplementalWorkout).toHaveBeenCalledWith('1');
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument();
    });

    // Check if workouts list was refreshed
    expect(supplementalWorkoutService.getAllSupplementalWorkouts).toHaveBeenCalledTimes(2);
  });
});