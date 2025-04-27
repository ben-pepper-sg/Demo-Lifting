import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { scheduleService } from '../services/api';
import * as Sentry from '@sentry/react';
import { startTransaction } from '@sentry/browser';

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
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showWorkoutTypeModal, setShowWorkoutTypeModal] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('UPPER');

  useEffect(() => {
    fetchSchedules();
  }, [dateFilter]);

  const fetchSchedules = async () => {
    // Create a transaction for Sentry performance monitoring
    const transaction = startTransaction({
      name: 'fetch_schedules',
      op: 'data-fetch',
    });
    
    try {
      setIsLoading(true);
      setError('');
      
      // Calculate start and end date range
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 7); // Show a week from the selected date
      
      // Add context to the transaction
      Sentry.setContext('date_range', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateFilter,
      });
      transaction.setTag('date_filter', dateFilter);
      
      const response = await scheduleService.getAllSchedules({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      setSchedules(response.data.schedules);
      transaction.setStatus('ok');
    } catch (err: any) {
      console.error('Fetch schedules error:', err);
      
      // Capture the error in Sentry
      Sentry.captureException(err, {
        tags: {
          action: 'fetch_schedules',
        },
        extra: {
          dateFilter,
          responseError: err.response?.data,
        },
      });
      
      setError(err.response?.data?.error || 'Failed to fetch schedules');
      transaction.setStatus('error');
    } finally {
      setIsLoading(false);
      transaction.finish();
    }
  };

  const handleBookSession = async (scheduleId: string) => {
    // Start a Sentry transaction for performance monitoring
    const transaction = startTransaction({
      name: 'book_session',
      op: 'user-action',
    });

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
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();
      const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;
      
      // Add context to Sentry
      Sentry.setContext('booking_attempt', {
        scheduleId,
        scheduleDate: schedule.date,
        dayOfWeek,
        isFridayOrSaturday,
      });
      transaction.setTag('day_of_week', dayOfWeek.toString());
      transaction.setTag('is_weekend', isFridayOrSaturday.toString());
      
      if (isFridayOrSaturday) {
        // For Friday or Saturday, we need to show the modal first
        setSelectedScheduleId(scheduleId);
        setShowWorkoutTypeModal(true);
        setIsLoading(false);
        transaction.setStatus('requires_user_input');
        transaction.finish();
        return;
      }
      
      // For other days, proceed with booking directly
      await scheduleService.bookTimeSlot(scheduleId);
      
      setSuccessMessage('Session booked successfully!');
      
      // Refresh schedules
      fetchSchedules();
      transaction.setStatus('ok');
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Capture error with Sentry
      Sentry.captureException(err, {
        tags: {
          action: 'book_session',
        },
        extra: {
          scheduleId,
          responseError: err.response?.data,
        },
      });
      
      // Special handling for workout type selection requirement
      if (err.response?.data?.requiresWorkoutType) {
        setSelectedScheduleId(scheduleId);
        setShowWorkoutTypeModal(true);
      } else {
        setError(err.response?.data?.error || 'Failed to book session');
      }
      transaction.setStatus('error');
    } finally {
      setIsLoading(false);
      transaction.finish();
    }
  };
  
  // Handle confirmation of workout type selection
  const handleConfirmWorkoutType = async () => {
    // Start a Sentry transaction for performance monitoring
    const transaction = startTransaction({
      name: 'confirm_workout_type',
      op: 'user-action',
    });
    
    try {
      setIsLoading(true);
      setError('');
      setShowWorkoutTypeModal(false);
      
      // Add context to Sentry
      Sentry.setContext('workout_selection', {
        scheduleId: selectedScheduleId,
        workoutType: selectedWorkoutType,
      });
      transaction.setTag('workout_type', selectedWorkoutType);
      
      // Book the session with the selected workout type
      await scheduleService.bookTimeSlot(selectedScheduleId, selectedWorkoutType);
      
      setSuccessMessage('Session booked successfully!');
      
      // Refresh schedules
      fetchSchedules();
      transaction.setStatus('ok');
    } catch (err: any) {
      console.error('Booking with workout type error:', err);
      
      // Capture error with Sentry
      Sentry.captureException(err, {
        tags: {
          action: 'confirm_workout_type',
        },
        extra: {
          scheduleId: selectedScheduleId,
          workoutType: selectedWorkoutType,
          responseError: err.response?.data,
        },
      });
      
      setError(err.response?.data?.error || 'Failed to book session');
      transaction.setStatus('error');
    } finally {
      setIsLoading(false);
      transaction.finish();
    }
  };

  const handleCancelBooking = async (scheduleId: string) => {
    // Create a transaction for Sentry performance monitoring
    const transaction = startTransaction({
      name: 'cancel_booking',
      op: 'user-action',
    });
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Add context to the transaction
      Sentry.setContext('cancel_booking', {
        scheduleId,
      });
      transaction.setTag('schedule_id', scheduleId);
      
      await scheduleService.cancelBooking(scheduleId);
      
      setSuccessMessage('Booking cancelled successfully!');
      
      // Refresh schedules
      fetchSchedules();
      transaction.setStatus('ok');
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      
      // Capture the error in Sentry
      Sentry.captureException(err, {
        tags: {
          action: 'cancel_booking',
        },
        extra: {
          scheduleId,
          responseError: err.response?.data,
        },
      });
      
      setError(err.response?.data?.error || 'Failed to cancel booking');
      transaction.setStatus('error');
    } finally {
      setIsLoading(false);
      transaction.finish();
    }
  };

  const isUserBooked = (schedule: Schedule) => {
    return schedule.bookings.some(booking => booking.user?.id === user?.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const groupSchedulesByDate = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    
    schedules.forEach(schedule => {
      const date = schedule.date.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });
    
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

// Wrap component with Sentry profiler for performance monitoring
export default Sentry.withProfiler(SchedulePage, { name: 'SchedulePage' });