import React from 'react';
import { render, screen } from '@testing-library/react';
import LiftChartWithErrorBoundary, { LiftChart } from './LiftChart';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: { 
    data: { 
      datasets: Array<{ 
        data: Array<number> 
      }> 
    }; 
    options: any 
  }) => {
    // Simulate chart errors based on data
    if (data.datasets[0].data.includes(NaN)) {
      throw new Error('Invalid data point');
    }
    if (data.datasets[0].data.length === 0) {
      throw new Error('No data points');
    }
    return <div data-testid="mocked-chart" />;
  },
}));

describe('LiftChart Error Handling', () => {
  // Mock console.error to avoid noise in test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  describe('Input Validation', () => {
    it('handles undefined workouts prop', () => {
      render(
        <LiftChartWithErrorBoundary
          workouts={undefined as any}
          liftType="BENCH"
          timeframe="3M"
        />
      );
      
      expect(screen.getByText(/No workout data available/i)).toBeInTheDocument();
    });

    it('handles null workouts prop', () => {
      render(
        <LiftChartWithErrorBoundary
          workouts={null as any}
          liftType="BENCH"
          timeframe="3M"
        />
      );
      
      expect(screen.getByText(/No workout data available/i)).toBeInTheDocument();
    });

    it('handles workouts with invalid date formats', () => {
      const invalidWorkouts = [{
        id: '1',
        date: 'invalid-date',
        liftType: 'BENCH',
        weight: 200,
        reps: 5,
        sets: 3,
      }];

      render(
        <LiftChartWithErrorBoundary
          workouts={invalidWorkouts}
          liftType="BENCH"
          timeframe="3M"
        />
      );

      expect(screen.getByText(/There was an error rendering the chart/i)).toBeInTheDocument();
    });

    it('handles workouts with missing weights', () => {
      const invalidWorkouts = [{
        id: '1',
        date: '2023-01-01T00:00:00.000Z',
        liftType: 'BENCH',
        weight: undefined as any,
        reps: 5,
        sets: 3,
      }];

      render(
        <LiftChartWithErrorBoundary
          workouts={invalidWorkouts}
          liftType="BENCH"
          timeframe="3M"
        />
      );

      expect(screen.getByText(/There was an error rendering the chart/i)).toBeInTheDocument();
    });
  });

  describe('Chart.js Error Handling', () => {
    it('catches and displays error for invalid data points', () => {
      const workoutsWithNaN = [{
        id: '1',
        date: '2023-01-01T00:00:00.000Z',
        liftType: 'BENCH',
        weight: NaN,
        reps: 5,
        sets: 3,
      }];

      render(
        <LiftChartWithErrorBoundary
          workouts={workoutsWithNaN}
          liftType="BENCH"
          timeframe="3M"
        />
      );

      expect(screen.getByText(/There was an error rendering the chart/i)).toBeInTheDocument();
      expect(screen.getByText(/Try selecting a different lift or timeframe/i)).toBeInTheDocument();
    });

    it('handles unknown lift types gracefully', () => {
      const validWorkouts = [{
        id: '1',
        date: '2023-01-01T00:00:00.000Z',
        liftType: 'BENCH',
        weight: 200,
        reps: 5,
        sets: 3,
      }];

      render(
        <LiftChartWithErrorBoundary
          workouts={validWorkouts}
          liftType="UNKNOWN_LIFT"
          timeframe="3M"
        />
      );

      // Should still render with default colors
      expect(screen.getByTestId('mocked-chart')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Recovery', () => {
    it('recovers when props are fixed after error', () => {
      const { rerender } = render(
        <LiftChartWithErrorBoundary
          workouts={[{
            id: '1',
            date: 'invalid-date',
            liftType: 'BENCH',
            weight: 200,
            reps: 5,
            sets: 3,
          }]}
          liftType="BENCH"
          timeframe="3M"
        />
      );

      expect(screen.getByText(/There was an error rendering the chart/i)).toBeInTheDocument();

      // Rerender with valid data
      rerender(
        <LiftChartWithErrorBoundary
          workouts={[{
            id: '1',
            date: '2023-01-01T00:00:00.000Z',
            liftType: 'BENCH',
            weight: 200,
            reps: 5,
            sets: 3,
          }]}
          liftType="BENCH"
          timeframe="3M"
        />
      );

      expect(screen.getByTestId('mocked-chart')).toBeInTheDocument();
    });
  });
});