import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { defaultScheduleService, userService } from '../services/api';

type DefaultSchedule = {
  id: string;
  dayOfWeek: number;
  time: string;
  capacity: number;
  workoutType: 'UPPER' | 'LOWER';
  isActive: boolean;
  coachId: string;
  coach: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DefaultScheduleAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [defaultSchedules, setDefaultSchedules] = useState<DefaultSchedule[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    dayOfWeek: 0,
    time: '16:00',
    capacity: 8,
    workoutType: 'UPPER',
    coachId: '',
    isActive: true,
  });
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDefaultSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await defaultScheduleService.getAllDefaultSchedules();
      setDefaultSchedules(response.data.defaultSchedules);
    } catch (err: any) {
      console.error('Fetch default schedules error:', err);
      setError(err.response?.data?.error || 'Failed to fetch default schedules');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchCoaches = useCallback(async () => {
    try {
      const response = await userService.getAllUsers();
      const coaches = response.data.users.filter(
        (user: User) => user.role === 'ADMIN' || user.role === 'COACH'
      );
      setCoaches(coaches);
    } catch (err: any) {
      console.error('Fetch coaches error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDefaultSchedules();
    fetchCoaches();
  }, [fetchDefaultSchedules, fetchCoaches]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else if (name === 'dayOfWeek' || name === 'capacity') {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');
      
      // If no coach is selected, use current admin user
      const submissionData = {
        ...formData,
        coachId: formData.coachId || user?.id,
      };
      
      await defaultScheduleService.upsertDefaultSchedule(submissionData);
      
      setSuccessMessage(`Default schedule ${isEditMode ? 'updated' : 'created'} successfully!`);
      
      // Reset form
      setFormData({
        id: '',
        dayOfWeek: 0,
        time: '16:00',
        capacity: 8,
        workoutType: 'UPPER',
        coachId: '',
        isActive: true,
      });
      
      setIsEditMode(false);
      
      // Refresh the schedule list
      fetchDefaultSchedules();
    } catch (err: any) {
      console.error('Submit default schedule error:', err);
      setError(err.response?.data?.error || 'Failed to save default schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (schedule: DefaultSchedule) => {
    setFormData({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      time: schedule.time,
      capacity: schedule.capacity,
      workoutType: schedule.workoutType,
      coachId: schedule.coachId,
      isActive: schedule.isActive,
    });
    
    setIsEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this default schedule?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await defaultScheduleService.deleteDefaultSchedule(id);
      
      setSuccessMessage('Default schedule deleted successfully!');
      fetchDefaultSchedules();
    } catch (err: any) {
      console.error('Delete default schedule error:', err);
      setError(err.response?.data?.error || 'Failed to delete default schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      id: '',
      dayOfWeek: 0,
      time: '16:00',
      capacity: 8,
      workoutType: 'UPPER',
      coachId: '',
      isActive: true,
    });
    
    setIsEditMode(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Default Schedule</h1>
      
      {/* Import and use AdminNavigation */}
      {React.createElement(require('../components/admin/AdminNavigation').default)}
      
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">
              {isEditMode ? 'Edit Default Schedule' : 'Create Default Schedule'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="dayOfWeek" className="form-label">Day of Week</label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  className="form-input"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                  required
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="time" className="form-label">Time</label>
                <select
                  id="time"
                  name="time"
                  className="form-input"
                  value={formData.time}
                  onChange={handleInputChange}
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
                  value={formData.workoutType}
                  onChange={handleInputChange}
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
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="coachId" className="form-label">Coach</label>
                <select
                  id="coachId"
                  name="coachId"
                  className="form-input"
                  value={formData.coachId}
                  onChange={handleInputChange}
                >
                  <option value="">Select a coach (or leave blank for yourself)</option>
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span className="ml-2">Active</span>
                </label>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : isEditMode 
                      ? 'Update Schedule' 
                      : 'Create Schedule'
                  }
                </button>
                
                {isEditMode && (
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        <div>
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Default Schedules</h2>
            
            {isLoading ? (
              <div className="text-center py-4">Loading schedules...</div>
            ) : defaultSchedules.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No default schedules configured.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {defaultSchedules
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.time.localeCompare(b.time))
                      .map((schedule) => (
                        <tr key={schedule.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{daysOfWeek[schedule.dayOfWeek]}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatTime(schedule.time)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              schedule.workoutType === 'UPPER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {schedule.workoutType === 'UPPER' ? 'Upper' : 'Lower'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {schedule.coach?.firstName} {schedule.coach?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              schedule.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {schedule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 mr-2"
                              onClick={() => handleEdit(schedule)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              Delete
                            </button>
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

export default DefaultScheduleAdminPage;