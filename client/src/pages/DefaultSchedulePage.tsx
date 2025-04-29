import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { defaultScheduleService, scheduleService } from '../services/api';
import { formatDate as formatDateUtil } from '../utils/dateUtils';

type DefaultSchedule = {
  id: string;
  dayOfWeek: number;
  time: string;
  capacity: number;
  workoutType: 'UPPER' | 'LOWER';
  isActive: boolean;
  coach: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DefaultSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [defaultSchedules, setDefaultSchedules] = useState<DefaultSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Get current date in local time (just the date portion YYYY-MM-DD)
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedSchedule, setSelectedSchedule] = useState<DefaultSchedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showNewTimeslotNotice, setShowNewTimeslotNotice] = useState<boolean>(true);
  
  // For Friday/Saturday handling
  const [showWorkoutTypeModal, setShowWorkoutTypeModal] = useState<boolean>(false);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('UPPER');

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
  
  useEffect(() => {
    fetchDefaultSchedules();
  }, [fetchDefaultSchedules]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getNextOccurrence = (dayOfWeek: number): Date => {
    const today = new Date(selectedDate);
    const todayDayOfWeek = today.getDay();
    const daysUntilNext = (dayOfWeek + 7 - todayDayOfWeek) % 7;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    return nextDate;
  };

  const formatDateDisplay = (date: Date): string => {
    return formatDateUtil(date.toISOString(), {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBookSession = async (defaultSchedule: DefaultSchedule) => {
    try {
      setIsBooking(true);
      setError('');
      setSuccessMessage('');
      setSelectedSchedule(defaultSchedule);
      
      // Get the next occurrence of this day
      const nextOccurrence = getNextOccurrence(defaultSchedule.dayOfWeek);
      
      // Format the date as YYYY-MM-DD
      const formattedDate = `${nextOccurrence.getFullYear()}-${String(nextOccurrence.getMonth() + 1).padStart(2, '0')}-${String(nextOccurrence.getDate()).padStart(2, '0')}`;
      
      // Check if it's Friday or Saturday (5 = Friday, 6 = Saturday)
      const isFridayOrSaturday = defaultSchedule.dayOfWeek === 5 || defaultSchedule.dayOfWeek === 6;
      
      if (isFridayOrSaturday) {
        // Show workout type selection modal
        setShowWorkoutTypeModal(true);
        setIsBooking(false);
        return;
      }
      
      // For other days, proceed with booking
      await createScheduleAndBook(defaultSchedule, formattedDate);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.response?.data?.error || 'Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  const createScheduleAndBook = async (defaultSchedule: DefaultSchedule, formattedDate: string, workoutType?: string) => {
    try {
      // Create schedule from default schedule
      const createResponse = await defaultScheduleService.createScheduleFromDefault({
        defaultScheduleId: defaultSchedule.id,
        date: formattedDate,
      });
      
      const newScheduleId = createResponse.data.schedule.id;
      
      // Book the newly created schedule
      await scheduleService.bookTimeSlot(newScheduleId, workoutType);
      
      setSuccessMessage('Session booked successfully!');
      // Refresh schedules
      fetchDefaultSchedules();
    } catch (err: any) {
      // If schedule already exists (409 Conflict), try to book it
      if (err.response?.status === 409 && err.response?.data?.scheduleId) {
        const existingScheduleId = err.response.data.scheduleId;
        await scheduleService.bookTimeSlot(existingScheduleId, workoutType);
        setSuccessMessage('Session booked successfully!');
      } else {
        throw err;
      }
    }
  };

  const handleConfirmWorkoutType = async () => {
    if (!selectedSchedule) return;
    
    try {
      setIsBooking(true);
      setError('');
      setShowWorkoutTypeModal(false);
      
      // Get the next occurrence of this day
      const nextOccurrence = getNextOccurrence(selectedSchedule.dayOfWeek);
      
      // Format the date as YYYY-MM-DD
      const formattedDate = `${nextOccurrence.getFullYear()}-${String(nextOccurrence.getMonth() + 1).padStart(2, '0')}-${String(nextOccurrence.getDate()).padStart(2, '0')}`;
      
      await createScheduleAndBook(selectedSchedule, formattedDate, selectedWorkoutType);
    } catch (err: any) {
      console.error('Booking with workout type error:', err);
      setError(err.response?.data?.error || 'Failed to book session');
    } finally {
      setIsBooking(false);
      setSelectedSchedule(null);
    }
  };

  // Group schedules by day of week
  const schedulesByDay: Record<number, DefaultSchedule[]> = {};
  defaultSchedules.forEach(schedule => {
    if (!schedulesByDay[schedule.dayOfWeek]) {
      schedulesByDay[schedule.dayOfWeek] = [];
    }
    schedulesByDay[schedule.dayOfWeek].push(schedule);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Class Schedule</h1>
      
      {/* New timeslot notification */}
      {showNewTimeslotNotice && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="py-1"><svg className="h-6 w-6 mr-4 fill-current text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
              <div className="font-bold">New Morning Classes Added!</div>
            </div>
            <button 
              onClick={() => setShowNewTimeslotNotice(false)}
              className="text-blue-500 hover:text-blue-700"
              aria-label="Dismiss notification"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="ml-10">New 8:00 AM and 9:00 AM classes are now available Monday through Friday!</p>
        </div>
      )}
      
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
                    setSelectedSchedule(null);
                  }}
                  disabled={isBooking}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirmWorkoutType}
                  disabled={isBooking}
                >
                  {isBooking ? 'Booking...' : 'Confirm'}
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
        <h2 className="text-xl font-semibold mb-4">Select Date</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="selectedDate" className="form-label">Starting From</label>
            <input
              type="date"
              id="selectedDate"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Showing classes available from this date forward. Your next available class for each day of the week will be calculated.
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading schedule...</div>
      ) : Object.keys(schedulesByDay).length > 0 ? (
        // Sort days by their order starting from today
        Array.from(Array(7).keys())
          .sort((a, b) => {
            const today = new Date(selectedDate).getDay();
            const distanceA = (a - today + 7) % 7;
            const distanceB = (b - today + 7) % 7;
            return distanceA - distanceB;
          })
          .filter(day => schedulesByDay[day])
          .map((dayOfWeek) => {
            const nextDate = getNextOccurrence(dayOfWeek);
            
            return (
              <div key={dayOfWeek} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  {daysOfWeek[dayOfWeek]} - {formatDateDisplay(nextDate)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedulesByDay[dayOfWeek]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((schedule) => (
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
                            {formatTime(schedule.time)} - {schedule.workoutType === 'UPPER' ? 'Upper Body' : 'Lower Body'}
                          </h3>
                          <span className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                            {dayOfWeek === 5 || dayOfWeek === 6 ? 'Flexible' : 'Fixed'} Workout
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          Capacity: {schedule.capacity} spots
                        </p>
                        
                        <button
                          className="btn-primary w-full"
                          onClick={() => handleBookSession(schedule)}
                          disabled={isBooking}
                        >
                          {isBooking ? 'Booking...' : 'Book This Time'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            );
          })
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">No default schedules available.</p>
        </div>
      )}
    </div>
  );
};

export default DefaultSchedulePage;