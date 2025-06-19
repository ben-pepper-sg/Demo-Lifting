import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LiftingClassPage from '../pages/LiftingClassPage';
import ClassViewPage from '../pages/ClassViewPage';

// Mock the API service
const mockGetClassDetails = jest.fn();
jest.mock('../services/api', () => ({
  scheduleService: {
    getClassDetails: mockGetClassDetails
  }
}));

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: '1', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }),
}));

describe('Comprehensive Auto-Refresh Testing', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.useFakeTimers();
    // Mock console methods to avoid cluttering test output
    console.log = jest.fn();
    console.error = jest.fn();
    jest.clearAllMocks();
    
    // Default successful response
    mockGetClassDetails.mockResolvedValue({
      data: {
        class: {
          participants: [
            { user: { firstName: 'John', lastName: 'Doe' }, workoutType: 'UPPER' }
          ],
          workoutType: 'UPPER',
          scheme: { sets: [{ reps: 5, percentage: 75 }], restTime: 120 },
          supplementalWorkouts: [
            { id: '1', name: 'Core Work', exercises: [{ name: 'Plank', sets: 3, reps: 30 }] }
          ]
        }
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  const mockCurrentTime = (timeString: string) => {
    const mockDate = new Date(timeString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  };

  describe('LiftingClassPage Auto-Refresh Logic', () => {
    it('should refresh at exactly 5 minutes before the hour (XX:55:00)', () => {
      // Set time to 2:30:00 PM
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Verify initial load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Fast-forward to 2:55:00 (25 minutes)
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should trigger refresh at 2:55:00
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });

    it('should refresh at the top of each hour (XX:00:00)', () => {
      // Set time to 2:55:00 PM (already at the 5-minute mark)
      mockCurrentTime('2023-06-15T14:55:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Verify initial load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Fast-forward to 3:00:00 (5 minutes)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should trigger refresh at 3:00:00
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple refresh cycles correctly', () => {
      // Start at 1:45:00 PM
      mockCurrentTime('2023-06-15T13:45:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Initial load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // First refresh at 1:55:00 (10 minutes later)
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);

      // Second refresh at 2:00:00 (5 minutes later)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(3);

      // Third refresh at 2:55:00 (55 minutes later)
      act(() => {
        jest.advanceTimersByTime(55 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(4);

      // Fourth refresh at 3:00:00 (5 minutes later)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(5);
    });

    it('should handle edge case when starting exactly at refresh time', () => {
      // Start exactly at 2:55:00 PM
      mockCurrentTime('2023-06-15T14:55:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Initial load should happen
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Next refresh should be at 3:00:00 (5 minutes)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });

    it('should handle starting exactly at the top of the hour', () => {
      // Start exactly at 3:00:00 PM
      mockCurrentTime('2023-06-15T15:00:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Initial load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Next refresh should be at 3:55:00 (55 minutes)
      act(() => {
        jest.advanceTimersByTime(55 * 60 * 1000);
      });
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });
  });

  describe('ClassViewPage Auto-Refresh Logic', () => {
    it('should refresh automatically on ClassViewPage', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      render(
        <MemoryRouter>
          <ClassViewPage />
        </MemoryRouter>
      );

      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Fast-forward to refresh time
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });

    it('should handle hour parameter in URL correctly', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      render(
        <MemoryRouter initialEntries={['/class-view?hour=16']}>
          <ClassViewPage />
        </MemoryRouter>
      );

      expect(mockGetClassDetails).toHaveBeenCalledWith('/schedule/class?hour=16');
    });
  });

  describe('Error Handling in Auto-Refresh', () => {
    it('should continue auto-refresh even when API calls fail', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      // Make the first API call fail
      mockGetClassDetails.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Initial failed load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Reset mock to succeed for subsequent calls
      mockGetClassDetails.mockResolvedValue({
        data: { class: { participants: [], workoutType: 'UPPER', scheme: {}, supplementalWorkouts: [] } }
      });

      // Fast-forward to refresh time
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should still attempt refresh despite previous failure
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });

    it('should handle intermittent network failures gracefully', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Simulate network failure on first refresh
      mockGetClassDetails.mockRejectedValueOnce(new Error('Timeout'));

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000); // 2:55:00
      });

      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);

      // Reset to successful response
      mockGetClassDetails.mockResolvedValue({
        data: { class: { participants: [], workoutType: 'UPPER', scheme: {}, supplementalWorkouts: [] } }
      });

      // Next refresh should work normally
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 3:00:00
      });

      expect(mockGetClassDetails).toHaveBeenCalledTimes(3);
    });
  });

  describe('Component Lifecycle and Auto-Refresh', () => {
    it('should clear timers when component unmounts', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      const { unmount } = render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      // Unmount the component
      unmount();

      // Fast-forward past refresh time
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should not trigger refresh after unmount
      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);
    });

    it('should restart timers when component remounts', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      const { unmount, rerender } = render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      // Update mock time
      mockCurrentTime('2023-06-15T14:40:00.000Z');

      // Remount
      rerender(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Should trigger new initial load
      expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
    });
  });

  describe('Time Zone Independence', () => {
    it('should work correctly across different time zones', () => {
      const timezones = [
        { zone: 'America/New_York', time: '2023-06-15T14:30:00-04:00' },
        { zone: 'Europe/London', time: '2023-06-15T19:30:00+01:00' },
        { zone: 'Asia/Tokyo', time: '2023-06-16T03:30:00+09:00' },
      ];

      timezones.forEach(({ zone, time }) => {
        jest.clearAllMocks();
        mockCurrentTime(time);
        
        render(
          <MemoryRouter>
            <LiftingClassPage />
          </MemoryRouter>
        );

        expect(mockGetClassDetails).toHaveBeenCalledTimes(1);

        // All should refresh after 25 minutes regardless of timezone
        act(() => {
          jest.advanceTimersByTime(25 * 60 * 1000);
        });

        expect(mockGetClassDetails).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Performance and Memory Considerations', () => {
    it('should not accumulate multiple timers', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      const { rerender } = render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Re-render multiple times (simulating props changes)
      for (let i = 0; i < 5; i++) {
        rerender(
          <MemoryRouter>
            <LiftingClassPage />
          </MemoryRouter>
        );
      }

      // Should only have initial calls, not accumulating
      expect(mockGetClassDetails).toHaveBeenCalledTimes(6); // 1 initial + 5 re-renders

      // Fast-forward to refresh time
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should only trigger one refresh, not multiple
      expect(mockGetClassDetails).toHaveBeenCalledTimes(7);
    });

    it('should handle rapid component updates without breaking refresh logic', () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      const { rerender } = render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        act(() => {
          jest.advanceTimersByTime(1000); // 1 second each
        });
        rerender(
          <MemoryRouter>
            <LiftingClassPage />
          </MemoryRouter>
        );
      }

      // Should still work correctly after rapid updates
      act(() => {
        jest.advanceTimersByTime(24 * 60 * 1000 + 50 * 1000); // Remaining time to refresh
      });

      // Should have triggered the scheduled refresh
      expect(mockGetClassDetails).toHaveBeenCalledTimes(12); // 11 initial + 1 refresh
    });
  });

  describe('Data Consistency During Auto-Refresh', () => {
    it('should handle data changes during auto-refresh', async () => {
      mockCurrentTime('2023-06-15T14:30:00.000Z');
      
      // Initial data
      mockGetClassDetails.mockResolvedValueOnce({
        data: {
          class: {
            participants: [{ user: { firstName: 'John', lastName: 'Doe' } }],
            workoutType: 'UPPER',
            scheme: {},
            supplementalWorkouts: []
          }
        }
      });

      render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });

      // Updated data for refresh
      mockGetClassDetails.mockResolvedValueOnce({
        data: {
          class: {
            participants: [
              { user: { firstName: 'John', lastName: 'Doe' } },
              { user: { firstName: 'Jane', lastName: 'Smith' } }
            ],
            workoutType: 'UPPER',
            scheme: {},
            supplementalWorkouts: []
          }
        }
      });

      // Trigger refresh
      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should show updated data
      await waitFor(() => {
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      });
    });
  });
});
