import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// Error monitoring removed

// Load environment variables
dotenv.config();

// Import database from centralized location
import { prisma } from './lib/prisma';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import workoutRoutes from './routes/workout.routes';
import scheduleRoutes from './routes/schedule.routes';
import defaultScheduleRoutes from './routes/defaultSchedule.routes';
import supplementalWorkoutRoutes from './routes/supplementalWorkout.routes';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Error monitoring initialization removed

// Middleware
// Error monitoring middleware removed

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'TFW MMA Lifting API' });
});

// Import admin routes
import adminRoutes from './routes/admin.routes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/default-schedule', defaultScheduleRoutes);
app.use('/api/supplemental-workouts', supplementalWorkoutRoutes);
app.use('/api/admin', adminRoutes);

// Error handler middleware removed

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Error logging removed
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle database connections and cleanup
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit();
});