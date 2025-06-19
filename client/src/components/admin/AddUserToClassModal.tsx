import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/api';

interface AddUserToClassModalProps {
  schedule: any;
  users: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserToClassModal: React.FC<AddUserToClassModalProps> = ({
  schedule,
  users,
  onClose,
  onSuccess,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Filter out users who are already in the class
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  // Get user IDs already in the class
  useEffect(() => {
    if (schedule && users) {
      const bookedUserIds = schedule.bookings.map((booking: any) => booking.userId);
      const filtered = users.filter(user => !bookedUserIds.includes(user.id));
      setAvailableUsers(filtered);
    }
  }, [schedule, users]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsAddingUser(true);
    
    try {
      await scheduleService.adminAddUserToClass({
        scheduleId: schedule.id,
        userId: selectedUserId,
        workoutType: schedule.workoutType,
      });
      
      setSuccess('User added to class successfully');
      
      // Reset form and refresh data after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to add user to class';
      setError(errorMessage);
      console.error('Add user to class error:', err);
    } finally {
      setIsAddingUser(false);
    }
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Format time (e.g., "16:00" to "4:00 PM")
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add User to Class
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Class:</strong> {schedule.workoutType} - {formatDate(schedule.date)} at {formatTime(schedule.time)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Current Participants:</strong> {schedule.currentParticipants}/{schedule.capacity}
                  </p>
                </div>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                  </div>
                )}
                
                {availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-yellow-600">
                    All users are already booked for this class or no users available.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Select User</label>
                      <select
                        id="userId"
                        className="form-input mt-1 block w-full"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                      >
                        <option value="">-- Select a user --</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        disabled={isAddingUser}
                      >
                        {isAddingUser ? 'Adding...' : 'Add User to Class'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserToClassModal;