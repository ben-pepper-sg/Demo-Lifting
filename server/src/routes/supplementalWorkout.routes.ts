import express from 'express';
import { getAllSupplementalWorkouts, createSupplementalWorkout, updateSupplementalWorkout, deleteSupplementalWorkout } from '../controllers/supplementalWorkout.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public route to get all supplemental workouts
router.get('/', getAllSupplementalWorkouts);

// Admin routes for managing supplemental workouts
router.post('/', authenticate, authorizeAdmin, createSupplementalWorkout);
router.put('/:id', authenticate, authorizeAdmin, updateSupplementalWorkout);
router.delete('/:id', authenticate, authorizeAdmin, deleteSupplementalWorkout);

export default router;