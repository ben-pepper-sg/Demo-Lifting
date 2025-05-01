import React from 'react';
import { render, act } from '@testing-library/react';
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
});