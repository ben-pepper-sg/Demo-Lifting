import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { useAuth } from '../hooks/useAuth';
import { userService, workoutService } from '../services/api';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the API services
jest.mock('../services/api', () => ({
  userService: {
    updateUser: jest.fn(),
  },
  workoutService: {
    getWorkoutScheme: jest.fn(),
    calculateWeight: jest.fn(),
  },
}));

// Mock the helpers utility
jest.mock('../utils/helpers', () => ({
  roundToNearest5: jest.fn((weight) => Math.round(weight / 5) * 5),
}));

describe('ProfilePage', () => {
  const mockUser = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'USER',
    maxBench: 225,
    maxOHP: 135,
    maxSquat: 275,
    maxDeadlift: 315,
  };

  const mockWorkoutScheme = {
    liftType: 'UPPER',
    reps: [5, 5, 5, 5, 5],
    percentages: [65, 75, 85, 85, 85],
    restTime: 180,
  };

  const mockCalculatedWeights = {
    bench: 146, // 65% of 225
    ohp: 88,   // 65% of 135
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });
    (workoutService.getWorkoutScheme as jest.Mock).mockResolvedValue({
      data: { scheme: mockWorkoutScheme },
    });
    (workoutService.calculateWeight as jest.Mock)
      .mockResolvedValueOnce({ data: { calculatedWeight: mockCalculatedWeights.bench } })
      .mockResolvedValueOnce({ data: { calculatedWeight: mockCalculatedWeights.ohp } });
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  it('renders profile information in view mode', async () => {
    renderProfilePage();
    
    expect(screen.getByRole('heading', { name: /your profile/i })).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('displays max lifts correctly', () => {
    renderProfilePage();
    
    expect(screen.getByText('Max Lifts')).toBeInTheDocument();
    expect(screen.getByText('225')).toBeInTheDocument(); // Bench
    expect(screen.getByText('135')).toBeInTheDocument(); // OHP
    expect(screen.getByText('275')).toBeInTheDocument(); // Squat
    expect(screen.getByText('315')).toBeInTheDocument(); // Deadlift
  });

  it('shows admin role correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'ADMIN' },
      logout: jest.fn(),
    });

    renderProfilePage();
    
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('displays workout scheme information', async () => {
    renderProfilePage();
    
    await waitFor(() => {
      expect(screen.getByText('Upper Body Day')).toBeInTheDocument();
      expect(screen.getByText('5, 5, 5, 5, 5')).toBeInTheDocument();
      expect(screen.getByText('65%, 75%, 85%, 85%, 85%')).toBeInTheDocument();
      expect(screen.getByText('3 minutes')).toBeInTheDocument();
    });
  });

  it('displays calculated working weights', async () => {
    renderProfilePage();
    
    await waitFor(() => {
      expect(screen.getByText('Your Working Weights:')).toBeInTheDocument();
      expect(screen.getByText('Bench Press:')).toBeInTheDocument();
      expect(screen.getByText('Overhead Press:')).toBeInTheDocument();
    });
  });

  it('allows week selection', async () => {
    renderProfilePage();
    
    await waitFor(() => {
      expect(screen.getByText('Current Program: Week 1')).toBeInTheDocument();
    });

    // Click on week 3
    fireEvent.click(screen.getByText('3'));
    
    await waitFor(() => {
      expect(workoutService.getWorkoutScheme).toHaveBeenCalledWith(
        expect.objectContaining({ week: 3 })
      );
    });
  });

  it('enters edit mode when edit button is clicked', () => {
    renderProfilePage();
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);
    
    expect(screen.getByRole('heading', { name: /your profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('populates form fields in edit mode', () => {
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Fill in mismatched passwords
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'differentpassword' },
    });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('handles successful profile update', async () => {
    (userService.updateUser as jest.Mock).mockResolvedValueOnce({});
    
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Update first name
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Johnny' },
    });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith('user1', {
        firstName: 'Johnny',
        lastName: 'Doe',
        email: 'john@example.com',
      });
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('handles profile update with password change', async () => {
    (userService.updateUser as jest.Mock).mockResolvedValueOnce({});
    
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Fill in password fields
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpassword' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'newpassword123' },
    });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith('user1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'newpassword123',
      });
    });
  });

  it('handles profile update errors', async () => {
    const errorMessage = 'Email already exists';
    (userService.updateUser as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });
    
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('cancels edit mode', () => {
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    (userService.updateUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderProfilePage();
    
    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('displays note about max lifts being admin-only', () => {
    renderProfilePage();
    
    expect(screen.getByText(/Max lifts can only be updated by your coach or admin/i)).toBeInTheDocument();
  });

  it('handles missing max lifts gracefully', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        maxBench: null,
        maxOHP: null,
        maxSquat: null,
        maxDeadlift: null,
      },
      logout: jest.fn(),
    });

    renderProfilePage();
    
    expect(screen.getAllByText('-')).toHaveLength(4); // Four "-" for missing lifts
  });

  it('handles workout scheme for lower body day', async () => {
    const lowerScheme = { ...mockWorkoutScheme, liftType: 'LOWER' };
    (workoutService.getWorkoutScheme as jest.Mock).mockResolvedValueOnce({
      data: { scheme: lowerScheme },
    });
    (workoutService.calculateWeight as jest.Mock)
      .mockResolvedValueOnce({ data: { calculatedWeight: 179 } }) // Squat
      .mockResolvedValueOnce({ data: { calculatedWeight: 205 } }); // Deadlift

    renderProfilePage();
    
    await waitFor(() => {
      expect(screen.getByText('Lower Body Day')).toBeInTheDocument();
      expect(screen.getByText('Back Squat:')).toBeInTheDocument();
      expect(screen.getByText('Deadlift:')).toBeInTheDocument();
    });
  });

  it('shows loading message when user is not available', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    renderProfilePage();
    
    expect(screen.getByText('Loading user data...')).toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('has proper form labels in edit mode', () => {
      renderProfilePage();
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderProfilePage();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Your Profile');
      
      const subHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('has proper button states', async () => {
      renderProfilePage();
      
      const editButton = screen.getByText('Edit Profile');
      expect(editButton).not.toBeDisabled();
      
      fireEvent.click(editButton);
      
      const saveButton = screen.getByText('Save Changes');
      const cancelButton = screen.getByText('Cancel');
      
      expect(saveButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });
});
