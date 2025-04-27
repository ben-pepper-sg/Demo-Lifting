import React from 'react';
import { render, screen } from '@testing-library/react';
import LiftChart from './LiftChart';

// Mock Chart.js as it's problematic in Jest environment
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart" />,
}));

describe('LiftChart', () => {
  const mockWorkouts = [
    {
      id: '1',
      date: '2023-01-01T00:00:00.000Z',
      liftType: 'BENCH',
      weight: 200,
      reps: 5,
      sets: 3,
    },
    {
      id: '2',
      date: '2023-01-08T00:00:00.000Z',
      liftType: 'BENCH',
      weight: 205,
      reps: 5,
      sets: 3,
    },
    {
      id: '3',
      date: '2023-01-15T00:00:00.000Z',
      liftType: 'BENCH',
      weight: 210,
      reps: 5,
      sets: 3,
    },
  ];

  it('renders the chart when workouts data is provided', () => {
    render(
      <LiftChart 
        workouts={mockWorkouts} 
        liftType="BENCH" 
        timeframe="3M" 
      />
    );
    
    expect(screen.getByTestId('mocked-chart')).toBeInTheDocument();
  });

  it('shows a message when no workout data is available', () => {
    render(
      <LiftChart 
        workouts={[]} 
        liftType="BENCH" 
        timeframe="3M" 
      />
    );
    
    expect(screen.getByText(/No workout data available/i)).toBeInTheDocument();
  });
});