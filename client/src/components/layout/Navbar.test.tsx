import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';

// Mock the auth hook
jest.mock('../../hooks/useAuth');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar', () => {
  const mockLogout = jest.fn();
  
  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo and basic navigation links', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText('TFW MMA')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current Class')).toBeInTheDocument();
    expect(screen.getByText('Lifting Class')).toBeInTheDocument();
  });

  it('shows sign in and sign up buttons when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('shows user-specific navigation when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER'
      },
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Lift Progress')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows admin link for admin users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'ADMIN'
      },
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays user initials in avatar when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER'
      },
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER'
      },
      logout: mockLogout,
    });

    renderNavbar();
    
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});