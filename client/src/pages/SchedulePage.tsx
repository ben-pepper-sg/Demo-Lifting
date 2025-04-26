import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { scheduleService } from '../services/api';

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

  useEffect(() => {
    fetchSchedules();
  }, [dateFilter]);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Calculate start and end date range
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 7); // Show a week from the selected date
      
      const response = await scheduleService.getAllSchedules({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      setSchedules(response.data.schedules);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async (scheduleId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      await scheduleService.bookTimeSlot(scheduleId);
      
      setSuccessMessage('Session booked successfully!');
      
      // Refresh schedules
      fetchSchedules();
    } catch (err: any) {
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
      
      await scheduleService.cancelBooking(scheduleId);
      
      setSuccessMessage('Booking cancelled successfully!');
      
      // Refresh schedules
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setIsLoading(false);
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