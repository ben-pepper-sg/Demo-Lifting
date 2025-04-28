import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService, scheduleService } from '../services/api';
import * as Sentry from '@sentry/react';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  maxBench: number | null;
  maxOHP: number | null;
  maxSquat: number | null;
  maxDeadlift: number | null;
};

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [errorUsers, setErrorUsers] = useState<string>('');
  
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '16:00', // Default to 4:00 PM
    workoutType: 'UPPER',
    coachId: '',
    capacity: 8,
  });
  const [isLoadingSchedule, setIsLoadingSchedule] = useState<boolean>(false);
  const [errorSchedule, setErrorSchedule] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      setErrorUsers('');
      
      const response = await userService.getAllUsers();
      setUsers(response.data.users);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setErrorUsers(errorMessage);
      
      // Log error to Sentry with context
      Sentry.captureException(err, {
        tags: {
          component: 'AdminPage',
          action: 'fetchUsers'
        },
        extra: {
          userId: user?.id,
          userRole: user?.role
        }
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScheduleForm({ ...scheduleForm, [name]: value });
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSchedule('');
    setSuccessMessage('');
    setIsLoadingSchedule(true);
    
    try {
      // If coach is not selected, use current admin user
      const coachId = scheduleForm.coachId || user?.id;
      
      if (!coachId) {
        setErrorSchedule('Coach ID is required');
        return;
      }
      
      // Set context for better error tracking
      Sentry.setContext('scheduleData', {
        ...scheduleForm,
        coachId,
        adminId: user?.id
      });
      
      await scheduleService.createSchedule({
        ...scheduleForm,
        coachId,
        capacity: parseInt(scheduleForm.capacity.toString()),
      });
      
      // Mark the transaction as successful
      transaction.finish();
      
      setSuccessMessage('Schedule created successfully');
      
      // Reset form
      setScheduleForm({
        date: '',
        time: '16:00',
        workoutType: 'UPPER',
        coachId: '',
        capacity: 8,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create schedule';
      setErrorSchedule(errorMessage);
      
      // Log detailed error to Sentry
      Sentry.captureException(err, {
        tags: {
          component: 'AdminPage',
          action: 'createSchedule',
          workoutType: scheduleForm.workoutType
        },
        extra: {
          scheduleForm,
          userId: user?.id,
          userRole: user?.role
        }
      });
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Create Schedule</h2>
            
            {errorSchedule && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorSchedule}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleCreateSchedule}>
              <div className="mb-4">
                <label htmlFor="date" className="form-label">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="form-input"
                  value={scheduleForm.date}
                  onChange={handleScheduleChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="time" className="form-label">Time</label>
                <select
                  id="time"
                  name="time"
                  className="form-input"
                  value={scheduleForm.time}
                  onChange={handleScheduleChange}
                  required
                >
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="workoutType" className="form-label">Workout Type</label>
                <select
                  id="workoutType"
                  name="workoutType"
                  className="form-input"
                  value={scheduleForm.workoutType}
                  onChange={handleScheduleChange}
                  required
                >
                  <option value="UPPER">Upper Body</option>
                  <option value="LOWER">Lower Body</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="capacity" className="form-label">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  className="form-input"
                  value={scheduleForm.capacity}
                  onChange={handleScheduleChange}
                  min="1"
                  max="20"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="coachId" className="form-label">Coach</label>
                <select
                  id="coachId"
                  name="coachId"
                  className="form-input"
                  value={scheduleForm.coachId}
                  onChange={handleScheduleChange}
                >
                  <option value="">Select a coach (or leave blank for yourself)</option>
                  {users.filter(u => u.role === 'ADMIN' || u.role === 'COACH').map(coach => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoadingSchedule}
              >
                {isLoadingSchedule ? 'Creating...' : 'Create Schedule'}
              </button>
            </form>
          </div>
        </div>
        
        <div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            
            {errorUsers && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorUsers}
              </div>
            )}
            
            {isLoadingUsers ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'COACH'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;