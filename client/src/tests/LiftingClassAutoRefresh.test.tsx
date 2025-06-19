import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LiftingClassPage from '../pages/LiftingClassPage';

// Mock the API service
jest.mock('../services/api', () => ({
  scheduleService: {
    getClassDetails: jest.fn().mockResolvedValue({
      data: {
        class: {
          participants: [],
          workoutType: 'UPPER',
          scheme: { reps: [5, 5, 5], restTime: 120 },
          supplementalWorkouts: []
        }
      }
    })
  }
}));

const mockDate = (dateString: string) => {
  const dateToUse = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => dateToUse);
};

describe('LiftingClassPage Auto Refresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should refresh at 54:30 minutes into the hour (buffer before the 55-minute mark)', () => {
    // Mock date to 10:30:00 AM
    mockDate('2023-01-01T10:30:00');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    // Verify initial fetch
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Expected timeout is 24 minutes and 30 seconds (from 10:30 to 10:54:30) = (24*60+30) * 1000 ms
    act(() => {
      // Fast-forward 24 minutes and 30 seconds
      jest.advanceTimersByTime(24 * 60 * 1000 + 30 * 1000);
    });
    
    // Verify refresh was triggered at 10:54:30
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
    
    // Next refresh should be at 10:59:30 (5 minutes later)
    act(() => {
      // Fast-forward 5 more minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    
    // Verify refresh at 10:59:30 (30 seconds before the top of the hour)
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(3);
  });

  it('should schedule refresh at 59:30 when current time is between 54:30 and 59:00', () => {
    // Mock date to 10:56:00 AM (after XX:55 but before XX:59)
    mockDate('2023-01-01T10:56:00');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    // Verify initial fetch
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Expected timeout is 3 minutes and 30 seconds (from 10:56 to 10:59:30) = (3*60+30) * 1000 ms
    act(() => {
      // Fast-forward 3 minutes and 30 seconds
      jest.advanceTimersByTime(3 * 60 * 1000 + 30 * 1000);
    });
    
    // Verify refresh was triggered at 10:59:30
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
  });

  it('should use the backup interval to catch refreshes if the main timer misses', () => {
    // Mock date to 10:54:40 (just after our 54:30 target)
    mockDate('2023-01-01T10:54:40');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    // Verify initial fetch
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Fast-forward 1 minute to trigger the interval check
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    
    // Verify the backup interval triggered a refresh since we're between 54:30 and 55:30
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
    
    // Move time to 10:59:40 (just after our 59:30 target)
    mockDate('2023-01-01T10:59:40');
    
    // Fast-forward 1 minute to trigger the interval check at 11:00:40
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    
    // Verify the backup interval triggered another refresh since we're between 59:30 and 00:30
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(3);
  });

  it('should handle edge case when approaching a new hour (at 59 minutes)', () => {
    // Mock date to 10:59:10 AM (just before the hour)
    mockDate('2023-01-01T10:59:10');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    // Verify initial fetch
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Expected timeout is 20 seconds (from 10:59:10 to 10:59:30) = 20 * 1000 ms
    act(() => {
      // Fast-forward 20 seconds
      jest.advanceTimersByTime(20 * 1000);
    });
    
    // Verify refresh was triggered at 10:59:30
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
  });

  // Component Cleanup Tests
  it('should clear timeouts and intervals on component unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    mockDate('2023-01-01T10:30:00');
    
    const { unmount } = render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    // Unmount the component
    unmount();
    
    // Verify cleanup functions were called
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('should handle multiple mount/unmount cycles without memory leaks', () => {
    mockDate('2023-01-01T10:30:00');
    
    // Mount and unmount multiple times
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(
        <MemoryRouter>
          <LiftingClassPage />
        </MemoryRouter>
      );
      unmount();
    }
    
    // Should not throw any errors and API should be called for each mount
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(3);
  });
});

describe('LiftingClassPage Error Handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should display error message when API call fails', async () => {
    // Mock API to reject
    const mockApi = require('../services/api');
    mockApi.scheduleService.getClassDetails.mockRejectedValueOnce({
      response: { data: { error: 'Server error' } }
    });

    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should display generic error message when API fails without specific error', async () => {
    const mockApi = require('../services/api');
    mockApi.scheduleService.getClassDetails.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch class details')).toBeInTheDocument();
    });
  });

  it('should recover from error state after successful refresh', async () => {
    const mockApi = require('../services/api');
    
    // First call fails
    mockApi.scheduleService.getClassDetails
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: {
          class: {
            participants: [],
            workoutType: 'UPPER',
            scheme: { reps: [5, 5, 5], restTime: 120 },
            supplementalWorkouts: []
          }
        }
      });

    mockDate('2023-01-01T10:54:20');

    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch class details')).toBeInTheDocument();
    });

    // Trigger refresh at 54:30
    act(() => {
      jest.advanceTimersByTime(10000); // 10 seconds to reach 54:30
    });

    // Wait for successful data to load
    await waitFor(() => {
      expect(screen.getByText('Rep Scheme for the Week')).toBeInTheDocument();
    });
  });
});

describe('LiftingClassPage URL Parameters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should call API with hour parameter when provided in URL', () => {
    const mockApi = require('../services/api');
    
    render(
      <MemoryRouter initialEntries={['/lifting-class?hour=8']}>
        <LiftingClassPage />
      </MemoryRouter>
    );

    expect(mockApi.scheduleService.getClassDetails).toHaveBeenCalledWith('/schedule/class?hour=8');
  });

  it('should call API without hour parameter when not provided in URL', () => {
    const mockApi = require('../services/api');
    
    render(
      <MemoryRouter initialEntries={['/lifting-class']}>
        <LiftingClassPage />
      </MemoryRouter>
    );

    expect(mockApi.scheduleService.getClassDetails).toHaveBeenCalledWith('/schedule/class');
  });
});

describe('LiftingClassPage Component States', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    // Make API call hang
    const mockApi = require('../services/api');
    mockApi.scheduleService.getClassDetails.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display no class message when classDetails is null', async () => {
    const mockApi = require('../services/api');
    mockApi.scheduleService.getClassDetails.mockResolvedValueOnce({
      data: { class: null }
    });

    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Class Currently in Session')).toBeInTheDocument();
      expect(screen.getByText('View 8am Class')).toBeInTheDocument();
      expect(screen.getByText('View 9am Class')).toBeInTheDocument();
    });
  });

  it('should render class data with participants correctly', async () => {
    const mockApi = require('../services/api');
    mockApi.scheduleService.getClassDetails.mockResolvedValueOnce({
      data: {
        class: {
          participants: [
            {
              userId: '1',
              firstName: 'John',
              lastInitial: 'D',
              weights: {
                bench: [135, 155, 175],
                ohp: [95, 105, 115]
              }
            }
          ],
          workoutType: 'UPPER',
          scheme: { reps: [5, 5, 5], restTime: 180 },
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
      expect(screen.getByText('John D.')).toBeInTheDocument();
      expect(screen.getByText('5-5-5')).toBeInTheDocument();
      expect(screen.getByText('3 minutes')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Overhead Press')).toBeInTheDocument();
    });
  });
});

describe('LiftingClassPage Edge Case Timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should handle refresh exactly at minute transitions', () => {
    // Test exactly at XX:00:00
    mockDate('2023-01-01T10:00:00');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Should schedule next refresh for 54:30 (54 minutes and 30 seconds away)
    act(() => {
      jest.advanceTimersByTime(54 * 60 * 1000 + 30 * 1000);
    });
    
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
  });

  it('should handle component mount exactly at XX:55:00', () => {
    mockDate('2023-01-01T10:55:00');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Should schedule next refresh for 59:30 (4 minutes and 30 seconds away)
    act(() => {
      jest.advanceTimersByTime(4 * 60 * 1000 + 30 * 1000);
    });
    
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
  });

  it('should not trigger backup interval when main timer works correctly', () => {
    mockDate('2023-01-01T10:30:00');
    
    render(
      <MemoryRouter>
        <LiftingClassPage />
      </MemoryRouter>
    );
    
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Advance to just before the scheduled refresh time (54:20)
    act(() => {
      jest.advanceTimersByTime(24 * 60 * 1000 + 20 * 1000);
    });
    
    // Should still be only 1 call (backup interval shouldn't have triggered)
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(1);
    
    // Advance the remaining 10 seconds to trigger the main timer
    act(() => {
      jest.advanceTimersByTime(10 * 1000);
    });
    
    // Now should be 2 calls (main timer triggered)
    expect(require('../services/api').scheduleService.getClassDetails).toHaveBeenCalledTimes(2);
  });
});