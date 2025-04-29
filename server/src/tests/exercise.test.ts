import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supplementalWorkoutRoutes from '../routes/supplementalWorkout.routes';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

// Mock the auth middleware for tests
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: 'admin-test-id', role: 'ADMIN' };
    next();
  },
  authorizeAdmin: (req, res, next) => {
    next();
  }
}));

// Create a test-specific Prisma client
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api/supplemental-workouts', supplementalWorkoutRoutes);

let adminToken: string;
let workoutId: string;
let exerciseId: string;

describe('Exercise Management', () => {
  beforeAll(async () => {
    // Create admin token for tests
    adminToken = jwt.sign(
      { userId: 'admin-test-id', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create a test supplemental workout
    const workout = await prisma.supplementalWorkout.create({
      data: {
        name: 'Test Workout',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Test workout for exercise testing'
      }
    });

    workoutId = workout.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.supplementalWorkout.delete({
      where: { id: workoutId }
    });
    
    await prisma.$disconnect();
  });

  describe('Add Exercise', () => {
    it('should add an exercise to a supplemental workout', async () => {
      const response = await request(app)
        .post(`/api/supplemental-workouts/${workoutId}/exercises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Exercise',
          description: 'This is a test exercise'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Exercise added successfully');
      expect(response.body.exercise).toHaveProperty('id');
      expect(response.body.exercise.name).toBe('Test Exercise');
      expect(response.body.exercise.supplementalWorkoutId).toBe(workoutId);

      // Save exercise ID for later tests
      exerciseId = response.body.exercise.id;
    });

    it('should reject adding an exercise without a name', async () => {
      const response = await request(app)
        .post(`/api/supplemental-workouts/${workoutId}/exercises`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'This exercise has no name'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Exercise name is required');
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post(`/api/supplemental-workouts/${workoutId}/exercises`)
        .send({
          name: 'Unauthorized Exercise',
          description: 'This should fail'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Update Exercise', () => {
    it('should update an existing exercise', async () => {
      const response = await request(app)
        .put(`/api/supplemental-workouts/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Exercise Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise updated successfully');
      expect(response.body.exercise.name).toBe('Updated Exercise Name');
      expect(response.body.exercise.description).toBe('Updated description');
    });
  });

  describe('Delete Exercise', () => {
    it('should delete an exercise', async () => {
      const response = await request(app)
        .delete(`/api/supplemental-workouts/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise deleted successfully');
    });
  });
});