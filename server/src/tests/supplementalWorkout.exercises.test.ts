import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import supplementalWorkoutRoutes from '../routes/supplementalWorkout.routes';

import { Request, Response, NextFunction } from 'express';

// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    req.user = { userId: 'admin-test-id', role: 'ADMIN' };
    next();
  },
  authorizeAdmin: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Set up the app
const app = express();
app.use(express.json());
app.use('/api/supplemental-workouts', supplementalWorkoutRoutes);

// Set up prisma client
const prisma = new PrismaClient();

describe('Supplemental Workout Exercises API', () => {
  // Variables to store IDs for testing
  let workoutId: string;
  let exerciseId: string;

  beforeAll(async () => {
    // Create a test workout
    try {
      const workout = await prisma.supplementalWorkout.create({
        data: {
          name: 'Test Workout for Exercises',
          category: 'UPPER',
          bodyPart: 'BICEPS',
          description: 'Test workout for API testing',
        },
      });
      workoutId = workout.id;
      console.log(`Test workout created with ID: ${workoutId}`);
    } catch (error) {
      console.error('Failed to create test workout:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up - delete test workout (should cascade delete exercises)
    try {
      if (workoutId) {
        await prisma.supplementalWorkout.delete({
          where: { id: workoutId },
        });
        console.log(`Test workout deleted: ${workoutId}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  // Tests
  describe('Exercise Management', () => {
    it('should add a new exercise to a workout', async () => {
      const response = await request(app)
        .post(`/api/supplemental-workouts/${workoutId}/exercises`)
        .send({
          name: 'Test Exercise',
          description: 'Exercise for API testing',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Exercise added successfully');
      expect(response.body.exercise).toHaveProperty('id');
      expect(response.body.exercise.name).toBe('Test Exercise');

      // Save exercise ID for later tests
      exerciseId = response.body.exercise.id;
    });

    it('should update an existing exercise', async () => {
      // Check if we have an exercise ID
      expect(exerciseId).toBeDefined();

      const response = await request(app)
        .put(`/api/supplemental-workouts/exercises/${exerciseId}`)
        .send({
          name: 'Updated Exercise Name',
          description: 'Updated description for testing',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise updated successfully');
      expect(response.body.exercise.name).toBe('Updated Exercise Name');
      expect(response.body.exercise.description).toBe('Updated description for testing');
    });

    it('should get all supplemental workouts with exercises', async () => {
      const response = await request(app).get('/api/supplemental-workouts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('supplementalWorkouts');
      
      // Find our test workout
      const testWorkout = response.body.supplementalWorkouts.find(
        (w: any) => w.id === workoutId
      );
      
      expect(testWorkout).toBeDefined();
      expect(testWorkout).toHaveProperty('exercises');
      expect(Array.isArray(testWorkout.exercises)).toBe(true);
      
      // Find our updated exercise
      const testExercise = testWorkout.exercises.find(
        (e: any) => e.id === exerciseId
      );
      
      expect(testExercise).toBeDefined();
      expect(testExercise.name).toBe('Updated Exercise Name');
    });

    it('should delete an exercise', async () => {
      // Check if we have an exercise ID
      expect(exerciseId).toBeDefined();

      const response = await request(app)
        .delete(`/api/supplemental-workouts/exercises/${exerciseId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise deleted successfully');

      // Verify it's deleted
      const getResponse = await request(app).get('/api/supplemental-workouts');
      const testWorkout = getResponse.body.supplementalWorkouts.find(
        (w: any) => w.id === workoutId
      );
      
      const deletedExercise = testWorkout.exercises.find(
        (e: any) => e.id === exerciseId
      );
      
      expect(deletedExercise).toBeUndefined();
    });
  });
});