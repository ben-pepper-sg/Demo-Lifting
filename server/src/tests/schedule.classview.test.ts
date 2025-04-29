import { Request, Response } from 'express';
import { PrismaClient, WorkoutCategory, BodyPart } from '@prisma/client';

// Mock the prisma import before importing the controller
const mockPrisma = {
  schedule: {
    findFirst: jest.fn(),
  },
  workoutScheme: {
    findFirst: jest.fn(),
  },
  supplementalWorkout: {
    findMany: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Import the controller after mocking
import { getClassDetails } from '../controllers/schedule.controller';

// Mock Request and Response
const mockRequest = () => {
  const req: Partial<Request> = {
    user: { userId: 'test-user-id', role: 'USER' },
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('Schedule Class View Controller', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2025-04-28T16:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return class details with supplemental workouts', async () => {
    // Mock schedule data
    const mockSchedule = {
      id: 'schedule1',
      date: new Date('2025-04-28'),
      time: '17:00',
      workoutType: 'UPPER',
      bookings: [
        {
          user: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            maxBench: 200,
            maxOHP: 120,
            maxSquat: 300,
            maxDeadlift: 350,
          },
        },
      ],
    };

    // Mock workout scheme
    const mockWorkoutScheme = {
      sets: [5, 5, 5],
      reps: [5, 5, 5],
      percentages: [75, 80, 85],
      restTime: 60,
    };

    // Mock supplemental workouts
    const mockSupplementalWorkouts = [
      {
        id: 'suppl1',
        name: 'Bicep Curl',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Curl with dumbbells',
      },
      {
        id: 'suppl2',
        name: 'Tricep Extension',
        category: 'UPPER',
        bodyPart: 'TRICEPS',
        description: 'Extend with dumbbells',
      },
    ];

    // Configure mocks
    mockPrisma.schedule.findFirst.mockResolvedValue(mockSchedule);
    mockPrisma.workoutScheme.findFirst.mockResolvedValue(mockWorkoutScheme);
    mockPrisma.supplementalWorkout.findMany.mockResolvedValue(mockSupplementalWorkouts);

    // Call the controller
    await getClassDetails(req, res);

    // Verify prisma calls
    expect(mockPrisma.schedule.findFirst).toHaveBeenCalled();
    expect(mockPrisma.workoutScheme.findFirst).toHaveBeenCalled();
    expect(mockPrisma.supplementalWorkout.findMany).toHaveBeenCalledWith({
      where: { category: 'UPPER' },
      orderBy: { id: 'asc' },
    });

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      class: expect.objectContaining({
        id: 'schedule1',
        workoutType: 'UPPER',
        supplementalWorkouts: expect.arrayContaining([
          expect.objectContaining({ name: 'Bicep Curl' }),
          expect.objectContaining({ name: 'Tricep Extension' }),
        ]),
      }),
    });
  });

  it('should handle no schedule found', async () => {
    // Configure mocks
    mockPrisma.schedule.findFirst.mockResolvedValue(null);

    // Call the controller
    await getClassDetails(req, res);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No class scheduled for the next hour',
    });
  });
});