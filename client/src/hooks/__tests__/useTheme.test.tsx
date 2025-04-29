import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../useTheme';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock component that uses the theme hook
const ThemeUser: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-status">{darkMode ? 'dark' : 'light'}</div>
      <button data-testid="theme-toggle" onClick={toggleDarkMode}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Remove the dark class from document if present
    document.documentElement.classList.remove('dark');
  });

  it('should default to system preference if no saved preference exists', () => {
    // Mock the system preference to be light
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false, // Light mode preference
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeUser />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle theme when button is clicked', () => {
    render(
      <ThemeProvider>
        <ThemeUser />
      </ThemeProvider>
    );

    // Initial state (assuming default is light based on mock)
    expect(screen.getByTestId('theme-status').textContent).toBe('light');
    
    // Toggle to dark
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(screen.getByTestId('theme-status').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
    
    // Toggle back to light
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(screen.getByTestId('theme-status').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('should use saved preference from localStorage if available', () => {
    // Set a stored preference for dark mode
    localStorage.setItem('darkMode', 'true');
    
    render(
      <ThemeProvider>
        <ThemeUser />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});