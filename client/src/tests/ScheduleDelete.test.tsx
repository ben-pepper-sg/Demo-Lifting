import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../pages/AdminPage';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin123', role: 'ADMIN' },
    loading: false,
  }),
}));

// Sample schedule data
const schedules = [
  {
    id: 'schedule1',
    date: new Date().toISOString(),
    time: '16:00',
    workoutType: 'UPPER',
    capacity: 8,
    currentParticipants: 3,
    coach: { id: 'coach1', firstName: 'Coach', lastName: 'One' },
    bookings: [{ id: 'booking1' }, { id: 'booking2' }, { id: 'booking3' }]
  },
  {
    id: 'schedule2',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    time: '17:00',
    workoutType: 'LOWER',
    capacity: 8,
    currentParticipants: 1,
    coach: { id: 'coach2', firstName: 'Coach', lastName: 'Two' },
    bookings: [{ id: 'booking4' }]
  }
];

// Setup MSW server
const server = setupServer(
  // Get schedules endpoint
  rest.get('/api/schedule', (req, res, ctx) => {
    return res(ctx.json({ schedules }));
  }),
  
  // Delete schedule endpoint
  rest.delete('/api/schedule/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'schedule1' || id === 'schedule2') {
      return res(ctx.json({ message: 'Schedule deleted successfully' }));
    }
    return res(ctx.status(404), ctx.json({ error: 'Schedule not found' }));
  }),
  
  // Get users endpoint
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  })
);

beforeAll(() => server.listen());
beforeEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.confirm
window.confirm = jest.fn();

describe('Schedule Delete Feature', () => {
  beforeEach(() => {
    (window.confirm as jest.Mock).mockReset();
  });
  
  it('displays the list of schedules', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });
    
    // Verify schedules are displayed
    expect(screen.getByText('Upper')).toBeInTheDocument();
    expect(screen.getByText('Lower')).toBeInTheDocument();
    expect(screen.getAllByText('Delete').length).toBe(2);
  });
  
  it('deletes a schedule when confirmed', async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });
    
    // Get all delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion was called
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this class? This will also remove all bookings associated with this class.'
    );
    
    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText('Class deleted successfully')).toBeInTheDocument();
    });
  });
  
  it('does not delete schedule when confirmation is canceled', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.queryByText('Loading schedules...')).not.toBeInTheDocument();
    });
    
    // Get all delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion was called
    expect(window.confirm).toHaveBeenCalled();
    
    // Verify success message does not appear
    await waitFor(() => {
      expect(screen.queryByText('Class deleted successfully')).not.toBeInTheDocument();
    });
  });
});