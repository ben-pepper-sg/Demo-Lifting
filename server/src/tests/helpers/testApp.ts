import express from 'express';
import cors from 'cors';
import { createMockPrisma } from './testDatabase';

// Mock the prisma instance globally for tests
const mockPrisma = createMockPrisma();

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

export const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(cors());
  
  // Import routes after mocking
  const authRoutes = require('../../routes/auth.routes').default;
  const scheduleRoutes = require('../../routes/schedule.routes').default;
  const userRoutes = require('../../routes/user.routes').default;
  const adminRoutes = require('../../routes/admin.routes').default;
  const workoutRoutes = require('../../routes/workout.routes').default;
  const supplementalWorkoutRoutes = require('../../routes/supplementalWorkout.routes').default;
  
  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/supplemental-workouts', supplementalWorkoutRoutes);
  
  return app;
};

export { mockPrisma };
