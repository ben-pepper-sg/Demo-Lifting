import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { prisma } from '../../index';

describe('Lift Progression API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test.progression@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405
      },
    });

    userId = user.id;

    // Create a JWT token for the test user
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create some test workout data
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    // Create test workout logs
    await prisma.workoutLog.createMany({
      data: [
        {
          userId: user.id,
          liftType: 'BENCH',
          weight: 200,
          reps: 5,
          sets: 3,
          date: twoMonthsAgo,
          notes: 'Initial test'
        },
        {
          userId: user.id,
          liftType: 'BENCH',
          weight: 210,
          reps: 5,
          sets: 3,
          date: oneMonthAgo,
          notes: 'Increasing weight'
        },
        {
          userId: user.id,
          liftType: 'BENCH',
          weight: 225,
          reps: 5,
          sets: 3,
          date: today,
          notes: 'New PR'
        },
        {
          userId: user.id,
          liftType: 'SQUAT',
          weight: 300,
          reps: 5,
          sets: 3,
          date: today,
          notes: 'Squat test'
        }
      ]
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workoutLog.deleteMany({
      where: { userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
  });

  describe('GET /api/workouts/progression', () => {
    it('should get lift progression data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/workouts/progression')
        .query({ liftType: 'BENCH', timeframe: '3M' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workouts');
      expect(response.body.workouts.length).toBeGreaterThan(0);
      expect(response.body.workouts[0].liftType).toBe('BENCH');
      expect(response.body).toHaveProperty('timeframe', '3M');
      expect(response.body).toHaveProperty('liftType', 'BENCH');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
    });

    it('should filter by lift type', async () => {
      const response = await request(app)
        .get('/api/workouts/progression')
        .query({ liftType: 'SQUAT', timeframe: '3M' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.workouts.every((w: any) => w.liftType === 'SQUAT')).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/workouts/progression')
        .query({ liftType: 'BENCH', timeframe: '3M' });

      expect(response.status).toBe(401);
    });

    it('should return 400 if liftType is missing', async () => {
      const response = await request(app)
        .get('/api/workouts/progression')
        .query({ timeframe: '3M' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });
});