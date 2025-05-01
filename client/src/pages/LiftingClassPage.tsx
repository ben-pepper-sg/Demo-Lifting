import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scheduleService } from '../services/api';
import { formatWeight } from '../utils/helpers';
import '../styles/LiftingClass.css';

const LiftingClassPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [classDetails, setClassDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchClassDetails();
    const interval = setInterval(fetchClassDetails, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClassDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get hour parameter from URL if present
      const hourParam = searchParams.get('hour');
      const endpoint = hourParam ? `/schedule/class?hour=${hourParam}` : '/schedule/class';
      console.log('Fetching class from endpoint:', endpoint);
      
      const response = await scheduleService.getClassDetails(endpoint);
      setClassDetails(response.data.class);
    } catch (err: any) {
      setClassDetails(null);
      setError(err.response?.data?.error || 'Failed to fetch class details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center py-8 bg-gray-50 rounded-lg w-96">
          <h2 className="text-xl font-semibold mb-2">No Class Currently in Session</h2>
          <p className="text-gray-600 mb-4">There is no class scheduled for the current hour.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/lifting-class?hour=8'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View 8am Class
            </button>
            <button
              onClick={() => window.location.href = '/lifting-class?hour=9'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View 9am Class
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format rep scheme
  const repScheme = classDetails.scheme.reps.join('-') + ' @ ' + classDetails.scheme.percentages.join('-') + '%';
  // Format rest period
  const restPeriod = Math.floor(classDetails.scheme.restTime / 60) + ' minutes';

  return (
    <div className="lifting-class-container">
      {/* Top bar with rep scheme, rest period, and cell phone rule */}
      <div className="lifting-class-header">
        <div className="lifting-class-scheme">
          <span>{repScheme}</span>
          <span>{restPeriod}</span>
        </div>
        <div className="lifting-class-cell-phone">
          10 Burpees per use of cell phone
        </div>
      </div>

      {/* Main content area with participants and lifts */}
      <div className="lifting-class-main">
        <div className="lifting-class-columns">
          <div className="lifting-class-column-header">
            Participants for the hour
          </div>
          <div className="lifting-class-column-header">
            {classDetails.workoutType === 'UPPER' ? 
              'Bench Press' : 
              'Back Squat / Bench Press'}
          </div>
          <div className="lifting-class-column-header">
            {classDetails.workoutType === 'UPPER' ? 
              'Overhead Press' : 
              'Deadlift / Overhead'}
          </div>
        </div>

        {/* Participant area with names and weights */}
        <div className="lifting-class-participant-area">
          {classDetails.participants && classDetails.participants.length > 0 && (
            <div>
              {classDetails.participants.map((participant: any) => (
                <div key={participant.userId} className="lifting-class-participant-row">
                  <div>{participant.firstName} {participant.lastInitial}.</div>
                  
                  {/* First lift column - Bench Press or Squat */}
                  <div className="text-center">
                    {classDetails.workoutType === 'UPPER' && participant.weights.bench ? (
                      <div className="lifting-class-weight-row">
                        {participant.weights.bench.map((weight: number, index: number) => (
                          <span key={index}>{formatWeight(weight)}</span>
                        ))}
                      </div>
                    ) : classDetails.workoutType === 'LOWER' && participant.weights.squat ? (
                      <div className="lifting-class-weight-row">
                        {participant.weights.squat.map((weight: number, index: number) => (
                          <span key={index}>{formatWeight(weight)}</span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                  
                  {/* Second lift column - OHP or Deadlift */}
                  <div className="text-center">
                    {classDetails.workoutType === 'UPPER' && participant.weights.ohp ? (
                      <div className="lifting-class-weight-row">
                        {participant.weights.ohp.map((weight: number, index: number) => (
                          <span key={index}>{formatWeight(weight)}</span>
                        ))}
                      </div>
                    ) : classDetails.workoutType === 'LOWER' && participant.weights.deadlift ? (
                      <div className="lifting-class-weight-row">
                        {participant.weights.deadlift.map((weight: number, index: number) => (
                          <span key={index}>{formatWeight(weight)}</span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Weighted reps instruction */}
        <div className="lifting-class-weighted-reps">
          30 weighted reps / exercise / set
        </div>
      </div>

      {/* Bottom area with supplemental exercises */}
      <div className="lifting-class-supplemental">
        <div className="lifting-class-supplemental-left">
          {/* Find the workout that has exactly 5 exercises (one for each body part) */}
          {classDetails.supplementalWorkouts
            .filter((workout: any) => 
              workout.category === 'UPPER' && 
              workout.exercises && 
              workout.exercises.length === 5)
            .slice(0, 1) // Just take the first one that matches
            .map((workout: any) => (
              <div key={workout.id} className="lifting-class-upper-supplemental">
                <div className="supplemental-workout-name">{workout.name}</div>
                {workout.exercises && workout.exercises.map((exercise: any) => (
                  <div key={exercise.id} className="supplemental-exercise">
                    <div className="supplemental-exercise-name">{exercise.name}</div>
                    {exercise.description && (
                      <div className="supplemental-exercise-description">{exercise.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
        <div className="lifting-class-supplemental-right">
          {/* Find the workout that has exactly 4 exercises (one for each lower body part) */}
          {classDetails.supplementalWorkouts
            .filter((workout: any) => 
              workout.category === 'LOWER' && 
              workout.exercises && 
              workout.exercises.length === 4)
            .slice(0, 1) // Just take the first one that matches
            .map((workout: any) => (
              <div key={workout.id} className="lifting-class-lower-supplemental">
                <div className="supplemental-workout-name">{workout.name}</div>
                {workout.exercises && workout.exercises.map((exercise: any) => (
                  <div key={exercise.id} className="supplemental-exercise">
                    <div className="supplemental-exercise-name">{exercise.name}</div>
                    {exercise.description && (
                      <div className="supplemental-exercise-description">{exercise.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LiftingClassPage;