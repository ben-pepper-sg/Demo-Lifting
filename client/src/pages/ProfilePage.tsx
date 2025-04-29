import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService, workoutService } from '../services/api';
import { roundToNearest5 } from '../utils/helpers';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Dashboard functionality
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [workoutScheme, setWorkoutScheme] = useState<any>(null);
  const [calculatedWeights, setCalculatedWeights] = useState<any>(null);

  const fetchWorkoutScheme = useCallback(async () => {
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
  }, [weekNumber, user]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate passwords if changing
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };
      
      // Only include password if changing
      if (formData.newPassword && formData.currentPassword) {
        updateData.password = formData.newPassword;
        // In a real app, we'd also send the current password for verification
      }
      
      if (user) {
        await userService.updateUser(user.id, updateData);
        setSuccessMessage('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="card">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <h3 className="text-xl font-semibold my-4">Change Password</h3>
            
            <div className="mb-4">
              <label htmlFor="currentPassword" className="form-label">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                className="form-input"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="form-input"
                  value={formData.newPassword}
                  onChange={handleChange}
                  minLength={6}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Account Information</h2>
              <button
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                <p className="text-lg">{user.firstName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                <p className="text-lg">{user.lastName}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-lg">{user.email}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
              <p className="text-lg">{user.role === 'ADMIN' ? 'Administrator' : 'Member'}</p>
            </div>
            
            <hr className="my-6 border-gray-200" />
            
            <h3 className="text-xl font-semibold mb-4">Max Lifts</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Bench Press</h4>
                <p className="text-2xl font-bold">{user.maxBench || '-'} <span className="text-sm font-normal">lbs</span></p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Overhead Press</h4>
                <p className="text-2xl font-bold">{user.maxOHP || '-'} <span className="text-sm font-normal">lbs</span></p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Back Squat</h4>
                <p className="text-2xl font-bold">{user.maxSquat || '-'} <span className="text-sm font-normal">lbs</span></p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Deadlift</h4>
                <p className="text-2xl font-bold">{user.maxDeadlift || '-'} <span className="text-sm font-normal">lbs</span></p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md mb-6">
              <p className="text-gray-600 text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                Max lifts can only be updated by your coach or admin. Please contact them if you need to update these values.
              </p>
            </div>
            
            <hr className="my-6 border-gray-200" />
            
            <h3 className="text-xl font-semibold mb-4">Current Program: Week {weekNumber}</h3>
            
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
        )}
      </div>
    </div>
  );
};

export default ProfilePage;