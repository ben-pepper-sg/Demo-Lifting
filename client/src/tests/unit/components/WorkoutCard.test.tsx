import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutCard from '../../../components/WorkoutCard';
import { BrowserRouter } from 'react-router-dom';

const mockWorkout = {
  id: '1',
  title: 'Test Workout',
  description: 'This is a test workout',
  exercises: [
    { name: 'Push-ups', sets: 3, reps: 10 },
    { name: 'Squats', sets: 3, reps: 12 }
  ],
  createdAt: new Date().toISOString(),
};

const renderWorkoutCard = (props = {}) => {
  return render(
    <BrowserRouter>
      <WorkoutCard 
        workout={mockWorkout}
        onSelect={jest.fn()}
        {...props}
      />
    </BrowserRouter>
  );
};

describe('WorkoutCard component', () => {
  test('renders workout information correctly', () => {
    renderWorkoutCard();
    
    expect(screen.getByText(mockWorkout.title)).toBeInTheDocument();
    expect(screen.getByText(mockWorkout.description)).toBeInTheDocument();
    expect(screen.getByText('2 exercises')).toBeInTheDocument();
  });
  
  test('calls onSelect when card is clicked', () => {
    const handleSelect = jest.fn();
    renderWorkoutCard({ onSelect: handleSelect });
    
    const card = screen.getByTestId('workout-card');
    fireEvent.click(card);
    
    expect(handleSelect).toHaveBeenCalledWith(mockWorkout.id);
  });
  
  test('shows exercise list when expanded', () => {
    renderWorkoutCard();
    
    // Initially, exercise details are not visible
    const pushups = screen.queryByText('Push-ups: 3 sets x 10 reps');
    expect(pushups).not.toBeInTheDocument();
    
    // Click the expand button
    const expandButton = screen.getByLabelText('Show details');
    fireEvent.click(expandButton);
    
    // Now exercise details should be visible
    expect(screen.getByText('Push-ups: 3 sets x 10 reps')).toBeInTheDocument();
    expect(screen.getByText('Squats: 3 sets x 12 reps')).toBeInTheDocument();
  });
});