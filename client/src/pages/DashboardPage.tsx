import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { workoutService } from '../services/api';
import { roundToNearest5 } from '../utils/helpers';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [workoutScheme, setWorkoutScheme] = useState<any>(null);
  const [calculatedWeights, setCalculatedWeights] = useState<any>(null);
  const [error, setError] = useState<string>('');



  const fetchWorkoutScheme = React.useCallback(async () => {
    try {
      // Get the current day of the week (1-7, Sunday is 0)
      const today = new Date().getDay() || 7; // Convert Sunday from 0 to 7
      const day = today <= 5 ? today : 1; // Default to Monday if weekend
      
      const response = await workoutService.getWorkoutScheme({
        week: weekNumber,
        day,
        liftType: day % 2 === 1 ? 'UPPER' : 'LOWER', // Odd days are upper, even are lower
      });
      
      setWorkoutScheme(response.data.scheme);
      
      if (user && user.maxBench && user.maxOHP && user.maxSquat && user.maxDeadlift) {
        calculateWeights(response.data.scheme);
      }
    } catch (err) {
      console.error('Failed to fetch workout scheme:', err);
    }
  }, [weekNumber, user]);  // Add dependencies

  useEffect(() => {
    fetchWorkoutScheme();
  }, [fetchWorkoutScheme]);

  const calculateWeights = async (scheme: any) => {
    if (!scheme) return;
    
    try {
      const liftType = scheme.liftType;
      const percentages = scheme.percentages;
      
      if (liftType === 'UPPER') {
        const benchResponse = await workoutService.calculateWeight({
          liftType: 'BENCH',
          percentage: percentages[0],
        });
        
        const ohpResponse = await workoutService.calculateWeight({
          liftType: 'OHP',
          percentage: percentages[0],
        });
        
        setCalculatedWeights({
          bench: benchResponse.data.calculatedWeight,
          ohp: ohpResponse.data.calculatedWeight,
        });
      } else {
        const squatResponse = await workoutService.calculateWeight({
          liftType: 'SQUAT',
          percentage: percentages[0],
        });
        
        const deadliftResponse = await workoutService.calculateWeight({
          liftType: 'DEADLIFT',
          percentage: percentages[0],
        });
        
        setCalculatedWeights({
          squat: squatResponse.data.calculatedWeight,
          deadlift: deadliftResponse.data.calculatedWeight,
        });
      }
    } catch (err) {
      console.error('Failed to calculate weights:', err);
    }
  };



  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card mb-6">
            <h2 className="text-2xl font-semibold mb-4">Current Program: Week {weekNumber}</h2>
            
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
                <button
                  key={week}
                  onClick={() => setWeekNumber(week)}
                  className={`px-3 py-1 rounded-md ${weekNumber === week ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  {week}
                </button>
              ))}
            </div>
            
            {workoutScheme ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">
                    {workoutScheme.liftType === 'UPPER' ? 'Upper Body Day' : 'Lower Body Day'}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    <strong>Rep Scheme:</strong> {workoutScheme.reps.join(', ')}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Percentages:</strong> {workoutScheme.percentages.map((p: number) => p + '%').join(', ')}
                  </p>
                  <p className="text-gray-600">
                    <strong>Rest Time:</strong> {workoutScheme.restTime / 60} minutes
                  </p>
                </div>
                
                {calculatedWeights && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-3">Your Working Weights:</h3>
                    
                    {workoutScheme.liftType === 'UPPER' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">Bench Press:</p>
                          <ul className="list-disc list-inside">
                            {workoutScheme.percentages.map((percentage: number, index: number) => (
                              <li key={index}>
                              Set {index + 1}: {roundToNearest5(calculatedWeights.bench * percentage / workoutScheme.percentages[0])} lbs
                              ({workoutScheme.reps[index]} reps)
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold">Overhead Press:</p>
                          <ul className="list-disc list-inside">
                            {workoutScheme.percentages.map((percentage: number, index: number) => (
                              <li key={index}>
                              Set {index + 1}: {roundToNearest5(calculatedWeights.ohp * percentage / workoutScheme.percentages[0])} lbs
                              ({workoutScheme.reps[index]} reps)
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">Back Squat:</p>
                          <ul className="list-disc list-inside">
                            {workoutScheme.percentages.map((percentage: number, index: number) => (
                              <li key={index}>
                              Set {index + 1}: {roundToNearest5(calculatedWeights.squat * percentage / workoutScheme.percentages[0])} lbs
                              ({workoutScheme.reps[index]} reps)
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold">Deadlift:</p>
                          <ul className="list-disc list-inside">
                            {workoutScheme.percentages.map((percentage: number, index: number) => (
                              <li key={index}>
                              Set {index + 1}: {roundToNearest5(calculatedWeights.deadlift * percentage / workoutScheme.percentages[0])} lbs
                              ({workoutScheme.reps[index]} reps)
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p>Loading workout scheme...</p>
            )}
          </div>
        </div>
        
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Your Max Lifts</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="font-medium text-gray-700">Bench Press:</label>
                <div className="text-2xl font-bold">{user?.maxBench || 'Not set'} lbs</div>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Overhead Press:</label>
                <div className="text-2xl font-bold">{user?.maxOHP || 'Not set'} lbs</div>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Back Squat:</label>
                <div className="text-2xl font-bold">{user?.maxSquat || 'Not set'} lbs</div>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Deadlift:</label>
                <div className="text-2xl font-bold">{user?.maxDeadlift || 'Not set'} lbs</div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-gray-600 text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                Max lifts can only be updated by your coach or admin. Please contact them if you need to update these values.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;