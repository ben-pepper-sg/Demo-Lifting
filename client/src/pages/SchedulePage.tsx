import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { scheduleService } from '../services/api';
// Error monitoring removed
import { formatDate as formatDateUtil } from '../utils/dateUtils';

type Schedule = {
  id: string;
  date: string;
  time: string;
  capacity: number;
  currentParticipants: number;
  workoutType: 'UPPER' | 'LOWER';
  coach: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bookings: any[];
};

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(() => {
    // Get current date in local time (just the date portion YYYY-MM-DD)
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showWorkoutTypeModal, setShowWorkoutTypeModal] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('UPPER');

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Calculate start and end date range
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 7); // Show a week from the selected date
      
      // Date range for debugging
      console.debug('Loading date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateFilter,
      });
      
      // Use raw date strings in the format YYYY-MM-DD
      const startDateStr = dateFilter;
      
      // Calculate the end date (7 days later)
      const endDateObj = new Date(dateFilter);
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
      
      console.debug('Fetching schedule with date range:', {
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      const response = await scheduleService.getAllSchedules({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      
      setSchedules(response.data.schedules);
    } catch (err: any) {
      console.error('Fetch schedules error:', err);
      
      // Log error with details
      console.error('Fetch schedules error:', {
        action: 'fetch_schedules',
        dateFilter,
        responseError: err.response?.data,
      });
      
      setError(err.response?.data?.error || 'Failed to fetch schedules');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);
  
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleBookSession = async (scheduleId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Find the schedule to check if it's Friday or Saturday
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      // Check if it's Friday or Saturday (5 = Friday, 6 = Saturday)
      // Use the date directly without timezone adjustment since server now stores UTC
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();
      const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
      
      // Log booking attempt details
      console.debug('Booking attempt:', {
        scheduleId,
        scheduleDate: schedule.date,
        dayOfWeek,
        isFridayOrSaturday,
      });
      
      if (isFridayOrSaturday) {
        // For Friday or Saturday, we need to show the modal first
        setSelectedScheduleId(scheduleId);
        setShowWorkoutTypeModal(true);
        setIsLoading(false);

        return;
      }
      
      // For other days, proceed with booking directly
      await scheduleService.bookTimeSlot(scheduleId);
      
      setSuccessMessage('Session booked successfully!');
      
      // Refresh schedules
      fetchSchedules();
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Log booking error details
      console.error('Booking error details:', {
        action: 'book_session',
        scheduleId,
        responseError: err.response?.data,
      });
      
      // Special handling for workout type selection requirement
      if (err.response?.data?.requiresWorkoutType) {
        setSelectedScheduleId(scheduleId);
        setShowWorkoutTypeModal(true);
      } else {
        setError(err.response?.data?.error || 'Failed to book session');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle confirmation of workout type selection
  const handleConfirmWorkoutType = async () => {
    
    try {
      setIsLoading(true);
      setError('');
      setShowWorkoutTypeModal(false);
      
      // Log workout selection
      console.debug('Workout selection:', {
        scheduleId: selectedScheduleId,
        workoutType: selectedWorkoutType,
      });
      
      // Book the session with the selected workout type
      await scheduleService.bookTimeSlot(selectedScheduleId, selectedWorkoutType);
      
      setSuccessMessage('Session booked successfully!');
      
      // Refresh schedules
      fetchSchedules();
    } catch (err: any) {
      console.error('Booking with workout type error:', err);
      
      // Log workout type selection error
      console.error('Workout type selection error:', {
        action: 'confirm_workout_type',
        scheduleId: selectedScheduleId,
        workoutType: selectedWorkoutType,
        responseError: err.response?.data,
      });
      
      setError(err.response?.data?.error || 'Failed to book session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (scheduleId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Log cancel booking action
      console.debug('Cancel booking:', {
        scheduleId
      });
      
      await scheduleService.cancelBooking(scheduleId);
      
      setSuccessMessage('Booking cancelled successfully!');
      
      // Refresh schedules
      fetchSchedules();
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      
      // Log cancel booking error details
      console.error('Cancel booking error details:', {
        action: 'cancel_booking',
        scheduleId,
        responseError: err.response?.data,
      });
      
      setError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  const isUserBooked = (schedule: Schedule) => {
    return schedule.bookings.some(booking => booking.user?.id === user?.id);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupSchedulesByDate = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    
    // Debug the schedule dates we're grouping
    console.debug('Grouping schedules by date:', schedules.map(s => ({ 
      id: s.id, 
      date: s.date, 
      dateObj: new Date(s.date),
      dateParts: s.date.split('T')[0]
    })));
    
    schedules.forEach(schedule => {
      // Get just the date part (YYYY-MM-DD) to use as key for grouping
      const date = schedule.date.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });
    
    // Log the resulting grouping
    console.debug('Grouped schedules:', Object.keys(grouped).map(date => ({ 
      date, 
      count: grouped[date].length 
    })));
    
    return grouped;
  };

  const schedulesByDate = groupSchedulesByDate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Class Schedule</h1>
      
      {/* Workout Type Selection Modal */}
      {showWorkoutTypeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Workout Type</h3>
              <p className="text-sm text-gray-500 mb-4">
                Friday and Saturday are flexible workout days. Please select which type of workout you would like to do.
              </p>
              
              <div className="mt-2 px-7 py-3">
                <div className="flex flex-col space-y-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="workoutType"
                      value="UPPER"
                      checked={selectedWorkoutType === 'UPPER'}
                      onChange={() => setSelectedWorkoutType('UPPER')}
                    />
                    <span className="ml-2">Upper Body</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="workoutType"
                      value="LOWER"
                      checked={selectedWorkoutType === 'LOWER'}
                      onChange={() => setSelectedWorkoutType('LOWER')}
                    />
                    <span className="ml-2">Lower Body</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowWorkoutTypeModal(false);
                    setSelectedScheduleId('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirmWorkoutType}
                  disabled={isLoading}
                >
                  {isLoading ? 'Booking...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Schedule</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="dateFilter" className="form-label">Start Date</label>
            <input
              type="date"
              id="dateFilter"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button
            className="btn-primary mt-6 w-full sm:w-auto"
            onClick={fetchSchedules}
          >
            Update Schedule
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading schedule...</div>
      ) : Object.keys(schedulesByDate).length > 0 ? (
        Object.entries(schedulesByDate).map(([date, daySchedules]) => (
          <div key={date} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{formatDate(date)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`card hover:shadow-md transition-shadow border-l-4 ${
                    schedule.workoutType === 'UPPER'
                      ? 'border-blue-500'
                      : 'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">
                      {schedule.time} - {schedule.workoutType === 'UPPER' ? 'Upper Body' : 'Lower Body'}
                    </h3>
                    <span className={`px-2 py-1 rounded-md text-xs ${
                      schedule.currentParticipants >= schedule.capacity
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {schedule.currentParticipants}/{schedule.capacity} spots
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Coach: {schedule.coach.firstName} {schedule.coach.lastName}
                  </p>
                  
                  {isUserBooked(schedule) ? (
                    <button
                      className="btn-danger w-full"
                      onClick={() => handleCancelBooking(schedule.id)}
                      disabled={isLoading}
                    >
                      Cancel Booking
                    </button>
                  ) : (
                    <button
                      className="btn-primary w-full"
                      onClick={() => handleBookSession(schedule.id)}
                      disabled={isLoading || schedule.currentParticipants >= schedule.capacity}
                    >
                      {schedule.currentParticipants >= schedule.capacity ? 'Class Full' : 'Book Session'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">No schedules available for the selected date range.</p>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;