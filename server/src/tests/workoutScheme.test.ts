import express from 'express';
import request from 'supertest';
import workoutRoutes from '../routes/workout.routes';
import { mockPrisma, createTestApp, authenticatedRequest } from '../utils/testUtils';

describe('Workout Scheme and Calculation API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp(workoutRoutes, 'workouts');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /scheme - Get workout scheme', () => {
    const mockWorkoutScheme = {
      id: '1',
      week: 1,
      day: 1,
      liftType: 'BENCH',
      sets: 3,
      reps: 8,
      percentage: 75,
      restTime: 180,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return workout scheme with valid parameters', async () => {
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(mockWorkoutScheme);

      const res = await authenticatedRequest(app, '1')
        .get('/scheme?week=1&day=1&liftType=BENCH');

      expect(res.status).toBe(200);
      expect(res.body.scheme).toEqual(mockWorkoutScheme);
      expect(mockPrisma.workoutScheme.findFirst).toHaveBeenCalledWith({
        where: {
          week: 1,
          day: 1,
          liftType: 'BENCH',
        },
      });
    });

    it('should return 400 when week parameter is missing', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/scheme?day=1&liftType=BENCH');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Week, day, and liftType are required');
    });

    it('should return 400 when day parameter is missing', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/scheme?week=1&liftType=BENCH');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Week, day, and liftType are required');
    });

    it('should return 400 when liftType parameter is missing', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/scheme?week=1&day=1');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Week, day, and liftType are required');
    });

    it('should return 404 when workout scheme not found', async () => {
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(null);

      const res = await authenticatedRequest(app, '1')
        .get('/scheme?week=99&day=7&liftType=BENCH');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Workout scheme not found');
    });

    it('should handle different lift types correctly', async () => {
      const liftTypes = ['BENCH', 'OHP', 'SQUAT', 'DEADLIFT'];
      
      for (const liftType of liftTypes) {
        mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce({
          ...mockWorkoutScheme,
          liftType,
        });

        const res = await authenticatedRequest(app, '1')
          .get(`/scheme?week=1&day=1&liftType=${liftType}`);

        expect(res.status).toBe(200);
        expect(res.body.scheme.liftType).toBe(liftType);
      }
    });

    it('should handle different week numbers', async () => {
      for (let week = 1; week <= 8; week++) {
        mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce({
          ...mockWorkoutScheme,
          week,
        });

        const res = await authenticatedRequest(app, '1')
          .get(`/scheme?week=${week}&day=1&liftType=BENCH`);

        expect(res.status).toBe(200);
        expect(res.body.scheme.week).toBe(week);
      }
    });

    it('should handle different day numbers', async () => {
      for (let day = 1; day <= 7; day++) {
        mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce({
          ...mockWorkoutScheme,
          day,
        });

        const res = await authenticatedRequest(app, '1')
          .get(`/scheme?week=1&day=${day}&liftType=BENCH`);

        expect(res.status).toBe(200);
        expect(res.body.scheme.day).toBe(day);
      }
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.workoutScheme.findFirst.mockRejectedValueOnce(new Error('Database error'));

      const res = await authenticatedRequest(app, '1')
        .get('/scheme?week=1&day=1&liftType=BENCH');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to get workout scheme');
    });
  });

  describe('GET /calculate - Calculate lift weight', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      maxBench: 200,
      maxOHP: 150,
      maxSquat: 300,
      maxDeadlift: 350,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should calculate weight correctly for BENCH', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 75,
        calculatedWeight: 150, // 200 * 0.75 = 150
      });
    });

    it('should calculate weight correctly for OHP', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=OHP&percentage=80');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        liftType: 'OHP',
        maxWeight: 150,
        percentage: 80,
        calculatedWeight: 120, // 150 * 0.80 = 120
      });
    });

    it('should calculate weight correctly for SQUAT', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=SQUAT&percentage=85');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        liftType: 'SQUAT',
        maxWeight: 300,
        percentage: 85,
        calculatedWeight: 255, // 300 * 0.85 = 255
      });
    });

    it('should calculate weight correctly for DEADLIFT', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=DEADLIFT&percentage=90');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        liftType: 'DEADLIFT',
        maxWeight: 350,
        percentage: 90,
        calculatedWeight: 315, // 350 * 0.90 = 315
      });
    });

    it('should round weights to nearest 5 pounds', async () => {
      // Test case where calculation doesn't land on a multiple of 5
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=77'); // 200 * 0.77 = 154

      expect(res.status).toBe(200);
      expect(res.body.calculatedWeight).toBe(155); // Rounded up to nearest 5
    });

    it('should round weights to nearest 5 pounds (rounding down)', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=73'); // 200 * 0.73 = 146

      expect(res.status).toBe(200);
      expect(res.body.calculatedWeight).toBe(145); // Rounded down to nearest 5
    });

    it('should return 400 when liftType parameter is missing', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('LiftType and percentage are required');
    });

    it('should return 400 when percentage parameter is missing', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('LiftType and percentage are required');
    });

    it('should return 400 for invalid lift type', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=INVALID&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid lift type');
    });

    it('should return 401 when user is not authenticated', async () => {
      const res = await request(app)
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 when max weight is not set for BENCH', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        maxBench: null,
      });

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Max weight for BENCH not set');
    });

    it('should return 400 when max weight is not set for OHP', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        maxOHP: null,
      });

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=OHP&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Max weight for OHP not set');
    });

    it('should return 400 when max weight is not set for SQUAT', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        maxSquat: null,
      });

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=SQUAT&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Max weight for SQUAT not set');
    });

    it('should return 400 when max weight is not set for DEADLIFT', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        maxDeadlift: null,
      });

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=DEADLIFT&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Max weight for DEADLIFT not set');
    });

    it('should handle different percentage values correctly', async () => {
      const testPercentages = [50, 60, 70, 80, 90, 100];
      
      for (const percentage of testPercentages) {
        const res = await authenticatedRequest(app, '1')
          .get(`/calculate?liftType=BENCH&percentage=${percentage}`);

        expect(res.status).toBe(200);
        expect(res.body.percentage).toBe(percentage);
        
        const expectedRaw = 200 * (percentage / 100);
        const expectedRounded = Math.round(expectedRaw / 5) * 5;
        expect(res.body.calculatedWeight).toBe(expectedRounded);
      }
    });

    it('should handle decimal percentages', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=67.5'); // 200 * 0.675 = 135

      expect(res.status).toBe(200);
      expect(res.body.percentage).toBe(67.5);
      expect(res.body.calculatedWeight).toBe(135); // Exactly 135
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to calculate lift weight');
    });

    it('should handle edge case with zero max weight', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        maxBench: 0,
      });

      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=75');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Max weight for BENCH not set');
    });

    it('should calculate correctly with very high percentages', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=105'); // 200 * 1.05 = 210

      expect(res.status).toBe(200);
      expect(res.body.calculatedWeight).toBe(210);
    });

    it('should calculate correctly with very low percentages', async () => {
      const res = await authenticatedRequest(app, '1')
        .get('/calculate?liftType=BENCH&percentage=10'); // 200 * 0.10 = 20

      expect(res.status).toBe(200);
      expect(res.body.calculatedWeight).toBe(20);
    });
  });
});
