import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService, scheduleService } from '../services/api';
// Error monitoring removed
import { debounce } from '../utils/helpers';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Max lifts edit modal state
  const [showLiftModal, setShowLiftModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [liftFormData, setLiftFormData] = useState({
    maxBench: '',
    maxOHP: '',
    maxSquat: '', 
    maxDeadlift: '',
  });
  const [updateSuccess, setUpdateSuccess] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');
  
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

  const fetchUsers = useCallback(async (search?: string) => {
    try {
      setIsLoadingUsers(true);
      setErrorUsers('');
      
      const response = await userService.getAllUsers({ search });
      setUsers(response.data.users);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setErrorUsers(errorMessage);
      
      // Log detailed error
      console.error('Failed to fetch users:', {
        component: 'AdminPage',
        action: 'fetchUsers',
        userId: user?.id,
        userRole: user?.role,
        error: err.message
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user?.id, user?.role]);
  
  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchUsers(query || undefined);
    }, 500),
    [fetchUsers]
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler for opening the edit max lifts modal
  const handleOpenLiftModal = (user: User) => {
    setSelectedUser(user);
    setLiftFormData({
      maxBench: user.maxBench?.toString() || '',
      maxOHP: user.maxOHP?.toString() || '',
      maxSquat: user.maxSquat?.toString() || '',
      maxDeadlift: user.maxDeadlift?.toString() || '',
    });
    setUpdateSuccess('');
    setUpdateError('');
    setShowLiftModal(true);
  };

  // Handler for closing the edit max lifts modal
  const handleCloseLiftModal = () => {
    setShowLiftModal(false);
    setSelectedUser(null);
    setLiftFormData({
      maxBench: '',
      maxOHP: '',
      maxSquat: '',
      maxDeadlift: '',
    });
  };

  // Handler for max lifts form input changes
  const handleLiftFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setLiftFormData({ ...liftFormData, [name]: value });
    }
  };

  // Handler for saving max lifts changes
  const handleSaveMaxLifts = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdateError('');
      setUpdateSuccess('');
      
      // Convert form data to numbers or null
      const updateData = {
        maxBench: liftFormData.maxBench ? parseInt(liftFormData.maxBench) : null,
        maxOHP: liftFormData.maxOHP ? parseInt(liftFormData.maxOHP) : null,
        maxSquat: liftFormData.maxSquat ? parseInt(liftFormData.maxSquat) : null,
        maxDeadlift: liftFormData.maxDeadlift ? parseInt(liftFormData.maxDeadlift) : null,
      };
      
      // Update the user's max lifts
      const response = await userService.updateUser(selectedUser.id, updateData);
      
      // Update the user in the local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? response.data.user : u
      ));
      
      setUpdateSuccess('Max lifts updated successfully');
      
      // Close the modal after a short delay
      setTimeout(() => {
        handleCloseLiftModal();
      }, 1500);
      
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update max lifts');
      console.error('Update max lifts error:', err);
    }
  };

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
      
      // Log schedule creation data
      console.debug('Creating schedule:', {
        ...scheduleForm,
        coachId,
        adminId: user?.id
      });
      
      await scheduleService.createSchedule({
        ...scheduleForm,
        coachId,
        capacity: parseInt(scheduleForm.capacity.toString()),
      });
      
      // Transaction was removed
      
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
      
      // Log detailed error for schedule creation
      console.error('Failed to create schedule:', {
        component: 'AdminPage',
        action: 'createSchedule',
        workoutType: scheduleForm.workoutType,
        scheduleForm,
        userId: user?.id,
        userRole: user?.role,
        error: err.message
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
            
            {/* Search bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="form-input w-full"
              />
            </div>
            
            {isLoadingUsers ? (
              <div className="text-center py-4">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No users found. Try adjusting your search.
              </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Lifts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          <div className="text-sm">
                            <div>B: {user.maxBench || '-'}</div>
                            <div>O: {user.maxOHP || '-'}</div>
                            <div>S: {user.maxSquat || '-'}</div>
                            <div>D: {user.maxDeadlift || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                            onClick={() => handleOpenLiftModal(user)}
                          >
                            Edit Max Lifts
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
      
      {/* Edit Max Lifts Modal */}
      {showLiftModal && selectedUser && (
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
                      Edit Max Lifts for {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    
                    {updateError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {updateError}
                      </div>
                    )}
                    
                    {updateSuccess && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {updateSuccess}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="maxBench" className="block text-sm font-medium text-gray-700">Bench Press (lbs)</label>
                        <input
                          type="text"
                          id="maxBench"
                          name="maxBench"
                          className="form-input mt-1 block w-full"
                          value={liftFormData.maxBench}
                          onChange={handleLiftFormChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="maxOHP" className="block text-sm font-medium text-gray-700">Overhead Press (lbs)</label>
                        <input
                          type="text"
                          id="maxOHP"
                          name="maxOHP"
                          className="form-input mt-1 block w-full"
                          value={liftFormData.maxOHP}
                          onChange={handleLiftFormChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="maxSquat" className="block text-sm font-medium text-gray-700">Back Squat (lbs)</label>
                        <input
                          type="text"
                          id="maxSquat"
                          name="maxSquat"
                          className="form-input mt-1 block w-full"
                          value={liftFormData.maxSquat}
                          onChange={handleLiftFormChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="maxDeadlift" className="block text-sm font-medium text-gray-700">Deadlift (lbs)</label>
                        <input
                          type="text"
                          id="maxDeadlift"
                          name="maxDeadlift"
                          className="form-input mt-1 block w-full"
                          value={liftFormData.maxDeadlift}
                          onChange={handleLiftFormChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSaveMaxLifts}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseLiftModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;