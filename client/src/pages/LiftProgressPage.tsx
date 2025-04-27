import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { workoutService } from '../services/api';
import LiftChart from '../components/lifts/LiftChart';
import * as Sentry from '@sentry/react';

const LiftProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedLift, setSelectedLift] = useState<string>('BENCH');
  const [timeframe, setTimeframe] = useState<string>('3M');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchWorkoutData();
    }
  }, [user, selectedLift, timeframe]);

  const fetchWorkoutData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Add Sentry transaction for performance monitoring
      const transaction = Sentry.startTransaction({
        name: 'fetch-lift-progression',
        op: 'data-fetch',
      });
      
      // Set context about the current user and selected options
      Sentry.setContext('lift-progression', {
        liftType: selectedLift,
        timeframe: timeframe,
        userId: user?.id,
      });
      
      const response = await workoutService.getLiftProgression({
        liftType: selectedLift,
        timeframe: timeframe,
      });
      
      setWorkouts(response.data.workouts);
      
      // Finish the transaction
      transaction.finish();
    } catch (err: any) {
      console.error('Failed to fetch lift progression data:', err);
      
      // Capture error in Sentry with additional context
      Sentry.captureException(err, {
        tags: {
          feature: 'lift-progression',
          liftType: selectedLift,
          timeframe: timeframe,
        },
        extra: {
          responseError: err.response?.data?.error,
          statusCode: err.response?.status,
        },
      });
      
      setError(err.response?.data?.error || 'Failed to load workout data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLift(e.target.value);
  };

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(e.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Lift Progression Tracker</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <label htmlFor="liftType" className="block text-sm font-medium text-gray-700 mb-1">
            Select Lift
          </label>
          <select
            id="liftType"
            className="form-select block w-full"
            value={selectedLift}
            onChange={handleLiftChange}
          >
            <option value="BENCH">Bench Press</option>
            <option value="OHP">Overhead Press</option>
            <option value="SQUAT">Back Squat</option>
            <option value="DEADLIFT">Deadlift</option>
          </select>
        </div>
        
        <div className="w-full md:w-1/3">
          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
            Timeframe
          </label>
          <select
            id="timeframe"
            className="form-select block w-full"
            value={timeframe}
            onChange={handleTimeframeChange}
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading workout data...</p>
          </div>
        ) : (
          <LiftChart 
            workouts={workouts} 
            liftType={selectedLift} 
            timeframe={timeframe}
          />
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Workout History</h2>
        
        {workouts.length === 0 ? (
          <p className="text-gray-500">No workout data available for the selected lift and timeframe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workouts.map((workout) => {
                  const date = new Date(workout.date);
                  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                  
                  return (
                    <tr key={workout.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formattedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{workout.weight}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{workout.reps}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{workout.sets}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{workout.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the component with Sentry performance monitoring
export default Sentry.withProfiler(LiftProgressPage, { name: 'LiftProgressPage' });