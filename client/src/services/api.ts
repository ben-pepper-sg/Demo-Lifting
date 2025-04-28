import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// User services
export const userService = {
  getAllUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  updateMaxLifts: (lifts: any) => api.put('/workouts/max-lifts', lifts),
};

// Workout services
export const workoutService = {
  getUserWorkouts: (params?: any) => api.get('/workouts', { params }),
  logWorkout: (workoutData: any) => api.post('/workouts', workoutData),
  getWorkoutScheme: (params: any) => api.get('/workouts/scheme', { params }),
  calculateWeight: (params: any) => api.get('/workouts/calculate', { params }),
  getLiftProgression: (params: any) => api.get('/workouts/progression', { params }),
};

// Schedule services
export const scheduleService = {
  getAllSchedules: (params?: any) => api.get('/schedule', { params }),
  createSchedule: (scheduleData: any) => api.post('/schedule', scheduleData),
  bookTimeSlot: (scheduleId: string, workoutType?: string) => api.post(`/schedule/${scheduleId}/book`, workoutType ? { workoutType } : {}),
  cancelBooking: (scheduleId: string) => api.delete(`/schedule/${scheduleId}/book`),
  getClassDetails: () => api.get('/schedule/class'),
  deleteSchedule: (id: string) => api.delete(`/schedule/${id}`),
};

export default {
  auth: authService,
  users: userService,
  workouts: workoutService,
  schedule: scheduleService,
};