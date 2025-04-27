import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import AdminPage from '../pages/AdminPage';
import { AuthProvider } from '../hooks/useAuth';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'admin123', role: 'ADMIN' },
    loading: false,
  }),
}));

// Set up MSW server to intercept API requests
const server = setupServer(
  // Handle user search request
  rest.get('/api/users', (req, res, ctx) => {
    const searchQuery = req.url.searchParams.get('search');
    
    if (searchQuery) {
      return res(ctx.json({
        users: [
          {
            id: 'user1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            maxBench: 225,
            maxOHP: 135,
            maxSquat: 315,
            maxDeadlift: 405,
          },
        ],
      }));
    }
    
    return res(ctx.json({
      users: [
        {
          id: 'user1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          maxBench: 225,
          maxOHP: 135,
          maxSquat: 315,
          maxDeadlift: 405,
        },
        {
          id: 'user2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'USER',
          maxBench: 95,
          maxOHP: 65,
          maxSquat: 135,
          maxDeadlift: 185,
        },
      ],
    }));
  }),
  
  // Handle user update request
  rest.put('/api/users/:userId', (req, res, ctx) => {
    const { userId } = req.params;
    const { maxBench, maxOHP, maxSquat, maxDeadlift } = req.body as any;
    
    return res(ctx.json({
      message: 'User updated successfully',
      user: {
        id: userId,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        maxBench,
        maxOHP,
        maxSquat,
        maxDeadlift,
      },
    }));
  }),
);

beforeAll(() => server.listen());
beforeEach(() => {
  // Clear handlers so we can override them in specific tests if needed
  server.resetHandlers();
});
afterAll(() => server.close());

describe('Admin User Search and Max Lift Update', () => {
  it('should render user search field', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });
    
    // Check for search field
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });
  
  it('should filter users when searching', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });
    
    // Initially should show all users
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    
    // Search for a user
    const searchInput = screen.getByPlaceholderText('Search users...');
    await userEvent.type(searchInput, 'john');
    
    // Trigger search
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // After search, should show filtered results
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBe(2); // Header row + 1 result
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
  
  it('should open edit max lifts modal when clicking edit button', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });
    
    // Click on edit button for a user
    const editButton = screen.getAllByText('Edit Max Lifts')[0];
    fireEvent.click(editButton);
    
    // Modal should be visible
    expect(screen.getByText('Edit Max Lifts for John Doe')).toBeInTheDocument();
  });
  
  it('should update user max lifts', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });
    
    // Click on edit button for a user
    const editButton = screen.getAllByText('Edit Max Lifts')[0];
    fireEvent.click(editButton);
    
    // Update values in the form
    const benchInput = screen.getByLabelText('Bench Press (lbs)');
    const ohpInput = screen.getByLabelText('Overhead Press (lbs)');
    const squatInput = screen.getByLabelText('Back Squat (lbs)');
    const deadliftInput = screen.getByLabelText('Deadlift (lbs)');
    
    fireEvent.change(benchInput, { target: { value: '235' } });
    fireEvent.change(ohpInput, { target: { value: '145' } });
    fireEvent.change(squatInput, { target: { value: '325' } });
    fireEvent.change(deadliftInput, { target: { value: '415' } });
    
    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Max lifts updated successfully')).toBeInTheDocument();
    });
  });
});