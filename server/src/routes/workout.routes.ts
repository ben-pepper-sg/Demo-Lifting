import express from 'express';
import {
  getUserWorkouts,
  logWorkout,
  updateMaxLifts,
  getWorkoutScheme,
  calculateLiftWeight,
  getLiftProgression,
} from '../controllers/workout.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Get all workouts for a user
router.get('/', authenticate, getUserWorkouts);

// Log a new workout
router.post('/', authenticate, logWorkout);

// Update max lift values (admin only)
router.put('/max-lifts', authenticate, authorizeAdmin, updateMaxLifts);

// Get workout scheme for a specific week
router.get('/scheme', getWorkoutScheme);

// Calculate weight for a lift
router.get('/calculate', authenticate, calculateLiftWeight);

// Get lift progression data over time
router.get('/progression', authenticate, getLiftProgression);

export default router;