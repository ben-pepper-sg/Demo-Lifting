import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

describe('Historical Data API', () => {
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'historical-test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
      },
    });
    testUserId = testUser.id;

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUserId, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test workout logs
    const workoutLogs = [
      {
        userId: testUserId,
        liftType: 'BENCH',
        weight: 185,
        reps: 5,
        sets: 3,
        date: new Date('2024-01-15'),
        notes: 'Test bench workout',
      },
      {
        userId: testUserId,
        liftType: 'OHP',
        weight: 115,
        reps: 5,
        sets: 3,
        date: new Date('2024-01-16'),
        notes: 'Test OHP workout',
      },
      {
        userId: testUserId,
        liftType: 'SQUAT',
        weight: 255,
        reps: 5,
        sets: 3,
        date: new Date('2024-01-17'),
        notes: 'Test squat workout',
      },
      {
        userId: testUserId,
        liftType: 'DEADLIFT',
        weight: 315,
        reps: 5,
        sets: 3,
        date: new Date('2024-01-18'),
        notes: 'Test deadlift workout',
      },
    ];

    await prisma.workoutLog.createMany({
      data: workoutLogs,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workoutLog.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('GET /api/workouts/historical-data', () => {
    it('should return historical data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/workouts/historical-data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('historicalData');
      expect(response.body).toHaveProperty('months', 6);
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');

      const { historicalData } = response.body;
      expect(historicalData).toHaveProperty('BENCH');
      expect(historicalData).toHaveProperty('OHP');
      expect(historicalData).toHaveProperty('SQUAT');
      expect(historicalData).toHaveProperty('DEADLIFT');

      // Check that each lift type has data
      expect(Array.isArray(historicalData.BENCH)).toBe(true);
      expect(Array.isArray(historicalData.OHP)).toBe(true);
      expect(Array.isArray(historicalData.SQUAT)).toBe(true);
      expect(Array.isArray(historicalData.DEADLIFT)).toBe(true);
    });

    it('should respect months parameter', async () => {
      const response = await request(app)
        .get('/api/workouts/historical-data?months=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.months).toBe(3);
    });

    it('should default to 6 months if no months parameter provided', async () => {
      const response = await request(app)
        .get('/api/workouts/historical-data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.months).toBe(6);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/workouts/historical-data')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authorization token required');
    });

    it('should return empty arrays for lift types with no data', async () => {
      // Create a new user with no workout logs
      const newUser = await prisma.user.create({
        data: {
          email: 'empty-data-test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Empty',
          lastName: 'User',
          role: 'USER',
        },
      });

      const newUserToken = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/workouts/historical-data')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      const { historicalData } = response.body;
      expect(historicalData.BENCH).toEqual([]);
      expect(historicalData.OHP).toEqual([]);
      expect(historicalData.SQUAT).toEqual([]);
      expect(historicalData.DEADLIFT).toEqual([]);

      // Clean up
      await prisma.user.delete({
        where: { id: newUser.id },
      });
    });

    it('should filter data by date range correctly', async () => {
      // Create workout logs outside the range
      const oldWorkout = await prisma.workoutLog.create({
        data: {
          userId: testUserId,
          liftType: 'BENCH',
          weight: 135,
          reps: 8,
          sets: 3,
          date: new Date('2020-01-01'), // Very old workout
          notes: 'Old workout',
        },
      });

      const response = await request(app)
        .get('/api/workouts/historical-data?months=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // The old workout should not be included in 1-month range
      const benchWorkouts = response.body.historicalData.BENCH;
      const oldWorkoutIncluded = benchWorkouts.some((workout: any) => 
        workout.id === oldWorkout.id
      );
      expect(oldWorkoutIncluded).toBe(false);

      // Clean up
      await prisma.workoutLog.delete({
        where: { id: oldWorkout.id },
      });
    });
  });
});
