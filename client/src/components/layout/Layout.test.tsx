import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../../hooks/useAuth';

// Mock child components
jest.mock('./Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar Component</nav>;
  };
});

jest.mock('./Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer Component</footer>;
  };
});

// Mock the auth hook
jest.mock('../../hooks/useAuth');

// Mock axios to prevent module loading issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

describe('Layout', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  const renderLayout = (children?: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Layout />}>
            {children && <Route index element={children} />}
          </Route>
        </Routes>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateMaxLifts: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    });
  });

  it('renders the basic layout structure', () => {
    renderLayout();
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    renderLayout();
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main.tagName).toBe('MAIN');
  });

  it('includes skip to content link for accessibility', () => {
    renderLayout();
    
    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('has proper layout classes for flexbox structure', () => {
    renderLayout();
    
    const layoutContainer = screen.getByTestId('navbar').parentElement;
    expect(layoutContainer).toHaveClass('min-h-screen', 'flex', 'flex-col');
  });

  it('main content area has flex-grow class', () => {
    renderLayout();
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-grow', 'container', 'mx-auto', 'px-4', 'py-8');
  });

  it('renders child content through Outlet', () => {
    const TestComponent = () => <div data-testid="test-content">Test Content</div>;
    
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TestComponent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('maintains proper document structure order', () => {
    renderLayout();
    
    const container = screen.getByTestId('navbar').parentElement;
    const children = Array.from(container?.children || []);
    
    expect(children[0]).toHaveAttribute('href', '#main-content'); // Skip link
    expect(children[1]).toHaveAttribute('data-testid', 'navbar');
    expect(children[2].tagName).toBe('MAIN');
    expect(children[3]).toHaveAttribute('data-testid', 'footer');
  });

  it('skip link has proper accessibility classes', () => {
    renderLayout();
    
    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toHaveClass('skip-link');
  });

  it('handles responsive layout', () => {
    renderLayout();
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('provides proper landmark navigation', () => {
    renderLayout();
    
    // Check that we have the expected landmarks
    expect(screen.getByRole('main')).toBeInTheDocument();
    // Navigation would be tested in Navbar.test.tsx
    // Footer would be tested in Footer.test.tsx
  });

  it('maintains semantic structure for screen readers', () => {
    renderLayout();
    
    const main = screen.getByRole('main');
    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(main.getAttribute('id')).toBe('main-content');
  });
});
