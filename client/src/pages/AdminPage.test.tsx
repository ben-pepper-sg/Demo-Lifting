import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from './AdminPage';
import { useAuth } from '../hooks/useAuth';
import { userService, scheduleService } from '../services/api';
import * as Sentry from '@sentry/react';

// Mock dependencies
jest.mock('../hooks/useAuth');
jest.mock('../services/api', () => ({
  userService: {
    getAllUsers: jest.fn(),
  },
  scheduleService: {
    createSchedule: jest.fn(),
  },
}));
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
    setStatus: jest.fn(),
  })),
  configureScope: jest.fn((cb) => cb({
    setSpan: jest.fn(),
    setContext: jest.fn(),
  })),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetAllUsers = userService.getAllUsers as jest.MockedFunction<typeof userService.getAllUsers>;
const mockCreateSchedule = scheduleService.createSchedule as jest.MockedFunction<typeof scheduleService.createSchedule>;

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useAuth mock
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'ADMIN', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', maxBench: null, maxOHP: null, maxSquat: null, maxDeadlift: null },
      loading: false,
      token: 'test-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
    });
    
    // Setup API mock responses
    mockGetAllUsers.mockResolvedValue({
      data: {
        users: [
          { id: '1', role: 'ADMIN', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', maxBench: null, maxOHP: null, maxSquat: null, maxDeadlift: null },
          { id: '2', role: 'USER', email: 'user@test.com', firstName: 'Regular', lastName: 'User', maxBench: null, maxOHP: null, maxSquat: null, maxDeadlift: null },
        ],
      },
    });
    
    mockCreateSchedule.mockResolvedValue({
      data: { message: 'Schedule created successfully' },
    });
  });

  it('should log error to Sentry when fetching users fails', async () => {
    const error = new Error('Failed to fetch users');
    mockGetAllUsers.mockRejectedValue(error);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          component: 'AdminPage',
          action: 'fetchUsers'
        },
        extra: expect.objectContaining({
          userId: '1',
          userRole: 'ADMIN'
        })
      });
    });
    
    expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
  });

  it('should create a transaction and log error when schedule creation fails', async () => {
    // Render component first so users are loaded
    const { getByLabelText, getByText } = render(<AdminPage />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });
    
    // Set up the form values
    const dateInput = getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-01' } });
    
    // Mock the API error
    const error = new Error('Failed to create schedule');
    error.response = { data: { error: 'Invalid schedule data' } };
    mockCreateSchedule.mockRejectedValue(error);
    
    // Submit the form
    const submitButton = getByText('Create Schedule');
    fireEvent.click(submitButton);
    
    // Verify error is captured in Sentry
    await waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: expect.objectContaining({
          component: 'AdminPage',
          action: 'createSchedule'
        }),
        extra: expect.objectContaining({
          scheduleForm: expect.any(Object),
          userId: '1',
          userRole: 'ADMIN'
        })
      });
    });
    
    expect(screen.getByText('Invalid schedule data')).toBeInTheDocument();
  });
});