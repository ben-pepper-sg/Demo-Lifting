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
  createUser: (userData: any) => api.post('/auth/admin/users', userData),
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
  getClassDetails: (endpoint = '/schedule/class') => {
    console.log('Fetching class details from:', `${API_URL}/api${endpoint}`);
    return api.get(endpoint);
  },
  deleteSchedule: (id: string) => api.delete(`/schedule/${id}`),
};

// Default schedule services
export const defaultScheduleService = {
  getAllDefaultSchedules: () => api.get('/default-schedule'),
  createScheduleFromDefault: (data: { defaultScheduleId: string, date: string }) => 
    api.post('/default-schedule/create-schedule', data),
  upsertDefaultSchedule: (data: any) => api.post('/default-schedule/admin', data),
  deleteDefaultSchedule: (id: string) => api.delete(`/default-schedule/admin/${id}`),
};

// Supplemental workout services
export const supplementalWorkoutService = {
  getAllSupplementalWorkouts: () => api.get('/supplemental-workouts'),
  createSupplementalWorkout: (data: any) => api.post('/supplemental-workouts', data),
  updateSupplementalWorkout: (id: string, data: any) => api.put(`/supplemental-workouts/${id}`, data),
  deleteSupplementalWorkout: (id: string) => api.delete(`/supplemental-workouts/${id}`),
  // Exercise management
  addExercise: (workoutId: string, data: any) => api.post(`/supplemental-workouts/${workoutId}/exercises`, data),
  updateExercise: (exerciseId: string, data: any) => api.put(`/supplemental-workouts/exercises/${exerciseId}`, data),
  deleteExercise: (exerciseId: string) => api.delete(`/supplemental-workouts/exercises/${exerciseId}`),
};

export default {
  auth: authService,
  users: userService,
  workouts: workoutService,
  schedule: scheduleService,
  defaultSchedule: defaultScheduleService,
  supplementalWorkout: supplementalWorkoutService,
};