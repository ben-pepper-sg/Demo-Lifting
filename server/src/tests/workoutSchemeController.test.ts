import { Request, Response } from 'express';

// Mock Prisma
const mockPrisma = {
  workoutScheme: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
import { getWorkoutScheme, calculateLiftWeight } from '../controllers/workout.controller';

describe('Workout Scheme and Calculation Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      query: {},
      user: { userId: '1' }
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('getWorkoutScheme', () => {
    const mockWorkoutScheme = {
      id: '1',
      programId: 'program-1',
      week: 1,
      day: 1,
      liftType: 'UPPER',
      sets: [3, 3, 3],
      reps: [5, 5, 5],
      percentages: [75, 80, 85],
      restTime: 180,
      supplementalWorkouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return workout scheme for valid parameters', async () => {
      mockRequest.query = { week: '1', day: '1', liftType: 'UPPER' };
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(mockWorkoutScheme);

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ scheme: mockWorkoutScheme });
      expect(mockPrisma.workoutScheme.findFirst).toHaveBeenCalledWith({
        where: {
          week: 1,
          day: 1,
          liftType: 'UPPER'
        }
      });
    });

    it('should return 400 if week parameter is missing', async () => {
      mockRequest.query = { day: '1', liftType: 'UPPER' };

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Week, day, and liftType are required' });
    });

    it('should return 400 if day parameter is missing', async () => {
      mockRequest.query = { week: '1', liftType: 'UPPER' };

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Week, day, and liftType are required' });
    });

    it('should return 400 if liftType parameter is missing', async () => {
      mockRequest.query = { week: '1', day: '1' };

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Week, day, and liftType are required' });
    });

    it('should return 404 if workout scheme not found', async () => {
      mockRequest.query = { week: '99', day: '1', liftType: 'UPPER' };
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(null);

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Workout scheme not found' });
    });

    it('should handle different lift types', async () => {
      const lowerScheme = { ...mockWorkoutScheme, liftType: 'LOWER' };
      mockRequest.query = { week: '1', day: '1', liftType: 'LOWER' };
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(lowerScheme);

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ scheme: lowerScheme });
    });

    it('should handle different weeks and days', async () => {
      const weekTwoScheme = { ...mockWorkoutScheme, week: 2, day: 3 };
      mockRequest.query = { week: '2', day: '3', liftType: 'UPPER' };
      mockPrisma.workoutScheme.findFirst.mockResolvedValueOnce(weekTwoScheme);

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ scheme: weekTwoScheme });
    });

    it('should handle database errors', async () => {
      mockRequest.query = { week: '1', day: '1', liftType: 'UPPER' };
      mockPrisma.workoutScheme.findFirst.mockRejectedValueOnce(new Error('Database error'));

      await getWorkoutScheme(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get workout scheme' });
    });
  });

  describe('calculateLiftWeight', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      maxBench: 200,
      maxOHP: 150,
      maxSquat: 300,
      maxDeadlift: 350,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate weight for BENCH lift', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '75' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 75,
        calculatedWeight: 150 // 200 * 0.75 = 150, rounded to nearest 5
      });
    });

    it('should calculate weight for OHP lift', async () => {
      mockRequest.query = { liftType: 'OHP', percentage: '80' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'OHP',
        maxWeight: 150,
        percentage: 80,
        calculatedWeight: 120 // 150 * 0.80 = 120
      });
    });

    it('should calculate weight for SQUAT lift', async () => {
      mockRequest.query = { liftType: 'SQUAT', percentage: '85' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'SQUAT',
        maxWeight: 300,
        percentage: 85,
        calculatedWeight: 255 // 300 * 0.85 = 255
      });
    });

    it('should calculate weight for DEADLIFT lift', async () => {
      mockRequest.query = { liftType: 'DEADLIFT', percentage: '90' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'DEADLIFT',
        maxWeight: 350,
        percentage: 90,
        calculatedWeight: 315 // 350 * 0.90 = 315
      });
    });

    it('should round weight to nearest 5 pounds', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '77' }; // 200 * 0.77 = 154, should round to 155
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 77,
        calculatedWeight: 155
      });
    });

    it('should handle rounding down to nearest 5 pounds', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '76' }; // 200 * 0.76 = 152, should round to 150
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 76,
        calculatedWeight: 150
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.query = { liftType: 'BENCH', percentage: '75' };

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 if liftType parameter is missing', async () => {
      mockRequest.query = { percentage: '75' };

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'LiftType and percentage are required' });
    });

    it('should return 400 if percentage parameter is missing', async () => {
      mockRequest.query = { liftType: 'BENCH' };

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'LiftType and percentage are required' });
    });

    it('should return 400 for invalid lift type', async () => {
      mockRequest.query = { liftType: 'INVALID', percentage: '75' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid lift type' });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '75' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 400 if max weight not set for lift type', async () => {
      const userWithoutMaxBench = { ...mockUser, maxBench: null };
      mockRequest.query = { liftType: 'BENCH', percentage: '75' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutMaxBench);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Max weight for BENCH not set' });
    });

    it('should handle all lift types with null max weights', async () => {
      const userWithoutMaxOHP = { ...mockUser, maxOHP: null };
      mockRequest.query = { liftType: 'OHP', percentage: '75' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutMaxOHP);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Max weight for OHP not set' });
    });

    it('should handle database errors', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '75' };
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to calculate lift weight' });
    });

    it('should handle edge case percentages correctly', async () => {
      // Test 0% - should return 0
      mockRequest.query = { liftType: 'BENCH', percentage: '0' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 0,
        calculatedWeight: 0
      });
    });

    it('should handle 100% percentage correctly', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '100' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 100,
        calculatedWeight: 200
      });
    });

    it('should handle over 100% percentage correctly', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '105' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 105,
        calculatedWeight: 210 // 200 * 1.05 = 210
      });
    });

    it('should handle decimal percentages', async () => {
      mockRequest.query = { liftType: 'BENCH', percentage: '75.5' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await calculateLiftWeight(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        liftType: 'BENCH',
        maxWeight: 200,
        percentage: 75.5,
        calculatedWeight: 150 // 200 * 0.755 = 151, rounded to 150
      });
    });
  });
});
