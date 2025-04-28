import express from 'express';
import { getAllDefaultSchedules, createScheduleFromDefault, upsertDefaultSchedule, deleteDefaultSchedule } from '../controllers/defaultSchedule.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public route to get all active default schedules
router.get('/', getAllDefaultSchedules);

// User route to create a schedule from a default schedule
router.post('/create-schedule', authenticate, createScheduleFromDefault);

// Admin only: Create/update default schedules
router.post('/admin', authenticate, authorizeAdmin, upsertDefaultSchedule);

// Admin only: Delete a default schedule
router.delete('/admin/:id', authenticate, authorizeAdmin, deleteDefaultSchedule);

export default router;