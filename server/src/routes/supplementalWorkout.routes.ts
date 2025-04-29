import express from 'express';
import { 
  getAllSupplementalWorkouts, 
  createSupplementalWorkout, 
  updateSupplementalWorkout, 
  deleteSupplementalWorkout,
  addExercise,
  updateExercise,
  deleteExercise
} from '../controllers/supplementalWorkout.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public route to get all supplemental workouts (including exercises)
router.get('/', getAllSupplementalWorkouts);

// Admin routes for managing supplemental workouts
router.post('/', authenticate, authorizeAdmin, createSupplementalWorkout);
router.put('/:id', authenticate, authorizeAdmin, updateSupplementalWorkout);
router.delete('/:id', authenticate, authorizeAdmin, deleteSupplementalWorkout);

// Admin routes for managing exercises within supplemental workouts
router.post('/:workoutId/exercises', authenticate, authorizeAdmin, addExercise);
router.put('/exercises/:exerciseId', authenticate, authorizeAdmin, updateExercise);
router.delete('/exercises/:exerciseId', authenticate, authorizeAdmin, deleteExercise);

export default router;