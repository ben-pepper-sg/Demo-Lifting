import { getClassDetails } from '../../controllers/schedule.controller';
import { prisma } from '../../utils/prisma';
import { Request, Response } from 'express';

// Mock prisma client
jest.mock('../../utils/prisma', () => ({
  prisma: {
    schedule: {
      findFirst: jest.fn(),
    },
    workoutScheme: {
      findFirst: jest.fn(),
    },
    supplementalWorkout: {
      findMany: jest.fn(),
    },
  },
}));

describe('Schedule Controller - getClassDetails', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  test('should return 404 when no schedule is found for the current hour', async () => {
    // Mock the prisma findFirst function to return null (no schedule found)
    (prisma.schedule.findFirst as jest.Mock).mockResolvedValue(null);

    // Call controller
    await getClassDetails(mockRequest as Request, mockResponse as Response);

    // Assert response
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: 'No class scheduled for the current hour' });
  });

  test('should return class details for the current hour class', async () => {
    // Mock date
    const mockDate = new Date('2025-04-30T08:02:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    // Mock schedule for an 8am class
    const mockSchedule = {
      id: 'schedule-1',
      date: new Date('2025-04-30'),
      time: '08:00',
      workoutType: 'UPPER',
      bookings: [
        {
          id: 'booking-1',
          user: {
            id: 'user-1',
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
    const mockScheme = {
      sets: [3, 3, 3],
      reps: [5, 5, 5],
      percentages: [80, 85, 90],
      restTime: 180,
    };

    // Mock supplemental workouts
    const mockSupplementals = [
      {
        id: 'suppl-1',
        name: 'Bicep Curls',
        category: 'UPPER',
        bodyPart: 'BICEPS',
      },
    ];

    // Setup the mocks
    (prisma.schedule.findFirst as jest.Mock).mockResolvedValue(mockSchedule);
    (prisma.workoutScheme.findFirst as jest.Mock).mockResolvedValue(mockScheme);
    (prisma.supplementalWorkout.findMany as jest.Mock).mockResolvedValue(mockSupplementals);

    // Call controller
    await getClassDetails(mockRequest as Request, mockResponse as Response);

    // Assert the time format used in the query
    expect(prisma.schedule.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          time: '08:00',
        }),
      })
    );

    // Assert response has correct data
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        class: expect.objectContaining({
          time: '08:00',
          workoutType: 'UPPER',
          participants: expect.arrayContaining([
            expect.objectContaining({
              firstName: 'John',
              weights: expect.objectContaining({
                bench: expect.any(Number),
                ohp: expect.any(Number),
              }),
            }),
          ]),
        }),
      })
    );
  });
});