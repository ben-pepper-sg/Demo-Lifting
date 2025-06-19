import express from 'express';
import {
  getAllSchedules,
  createSchedule,
  bookTimeSlot,
  cancelBooking,
  getClassDetails,
  deleteSchedule,
  adminAddUserToClass,
} from '../controllers/schedule.controller';
import { authenticate, authorizeAdmin, authorizeCoach } from '../middleware/auth.middleware';

const router = express.Router();

// Get class details for the next hour - THIS MUST COME FIRST due to Express route ordering
router.get('/class', getClassDetails);

// Get all schedules
router.get('/', getAllSchedules);

// Create a new schedule (admin/coach only)
router.post('/', authenticate, authorizeCoach, createSchedule);

// Book a time slot
router.post('/:scheduleId/book', authenticate, bookTimeSlot);

// Cancel a booking
router.delete('/:scheduleId/book', authenticate, cancelBooking);

// Admin add user to a class (admin only)
router.post('/admin/add-user', authenticate, authorizeAdmin, adminAddUserToClass);

// Delete a schedule (admin/coach only)
router.delete('/:id', authenticate, authorizeCoach, deleteSchedule);

export default router;