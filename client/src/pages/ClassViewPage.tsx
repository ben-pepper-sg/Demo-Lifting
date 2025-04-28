import React, { useState, useEffect } from 'react';
import { scheduleService } from '../services/api';

type ClassParticipant = {
  userId: string;
  firstName: string;
  lastInitial: string;
  weights: {
    bench?: number;
    ohp?: number;
    squat?: number;
    deadlift?: number;
  };
};

type SupplementalWorkout = {
  id: string;
  name: string;
  category: 'UPPER' | 'LOWER';
  bodyPart: string;
  description?: string;
};

type ClassDetails = {
  id: string;
  date: string;
  time: string;
  workoutType: 'UPPER' | 'LOWER';
  participants: ClassParticipant[];
  scheme: {
    sets: number[];
    reps: number[];
    percentages: number[];
    restTime: number;
  };
  supplementalWorkouts: SupplementalWorkout[];
};

const ClassViewPage: React.FC = () => {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchClassDetails();
    
    // Update the time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Refresh class details every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchClassDetails();
    }, 300000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchClassDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await scheduleService.getClassDetails();
      setClassDetails(response.data.class);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setClassDetails(null);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch class details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // Convert "16:00" to "4:00 PM"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Current Class</h1>
      
      <div className="text-right mb-4 text-gray-600">
        Current time: {currentTime.toLocaleTimeString()}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading class details...</div>
      ) : classDetails ? (
        <div>
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {classDetails.workoutType === 'UPPER' ? 'Upper Body Day' : 'Lower Body Day'}
              </h2>
              <div className="text-gray-600">
                {formatDate(classDetails.date)} at {formatTime(classDetails.time)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-semibold mb-2">Workout Details</h3>
              <p><strong>Rep Scheme:</strong> {classDetails.scheme.reps.join(', ')}</p>
              <p><strong>Percentages:</strong> {classDetails.scheme.percentages.map(p => p + '%').join(', ')}</p>
              <p><strong>Rest Time:</strong> {classDetails.scheme.restTime / 60} minutes</p>
            </div>
            
            {classDetails.supplementalWorkouts && classDetails.supplementalWorkouts.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-md mb-6">
                <h3 className="font-semibold mb-3">This Week's Supplemental Workouts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classDetails.supplementalWorkouts.map(workout => (
                    <div key={workout.id} className="bg-white p-4 rounded shadow-sm border border-blue-100">
                      <h4 className="font-medium text-lg mb-1">{workout.name}</h4>
                      <div className="flex items-center mb-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                          {workout.bodyPart}
                        </span>
                      </div>
                      {workout.description && (
                        <p className="text-sm text-gray-600">{workout.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-semibold mb-4">Class Participants</h3>
            
            {classDetails.participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      {classDetails.workoutType === 'UPPER' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bench Press
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overhead Press
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Back Squat
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deadlift
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classDetails.participants.map((participant) => (
                      <tr key={participant.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {participant.firstName} {participant.lastInitial}.
                          </div>
                        </td>
                        {classDetails.workoutType === 'UPPER' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {participant.weights.bench ? `${participant.weights.bench} lbs` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {participant.weights.ohp ? `${participant.weights.ohp} lbs` : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {participant.weights.squat ? `${participant.weights.squat} lbs` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {participant.weights.deadlift ? `${participant.weights.deadlift} lbs` : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600">
                No participants registered for this class yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Class Currently in Session</h2>
          <p className="text-gray-600">
            There is no class scheduled for the next hour, or the class information is not available.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassViewPage;