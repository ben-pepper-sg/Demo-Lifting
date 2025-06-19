import { Request, Response } from 'express';
import { adminAddUserToClass } from '../../controllers/schedule.controller';
import { prisma } from '../../lib/prisma';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    schedule: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('adminAddUserToClass Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockSchedule = {
    id: 'schedule-123',
    date: new Date(),
    time: '16:00',
    workoutType: 'UPPER',
    capacity: 8,
    currentParticipants: 3,
    bookings: [],
  };
  
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };
  
  beforeEach(() => {
    mockRequest = {
      body: {
        scheduleId: 'schedule-123',
        userId: 'user-123',
      },
      user: {
        userId: 'admin-123',
        role: 'ADMIN',
      },
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    jest.clearAllMocks();
  });
  
  test('should add a user to a class successfully', async () => {
    // Mock successful schedule lookup
    (prisma.schedule.findUnique as jest.Mock).mockResolvedValue(mockSchedule);
    
    // Mock successful user lookup
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock no existing booking
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    
    // Mock successful booking creation
    const mockBooking = {
      id: 'booking-123',
      scheduleId: 'schedule-123',
      userId: 'user-123',
      workoutType: 'UPPER',
    };
    (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);
    
    // Mock successful schedule update
    (prisma.schedule.update as jest.Mock).mockResolvedValue({
      ...mockSchedule,
      currentParticipants: 4,
    });
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
      where: { id: 'schedule-123' },
      include: { bookings: true },
    });
    
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    });
    
    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        scheduleId: 'schedule-123',
        userId: 'user-123',
      },
    });
    
    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: {
        scheduleId: 'schedule-123',
        userId: 'user-123',
        workoutType: 'UPPER',
      },
    });
    
    expect(prisma.schedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule-123' },
      data: {
        currentParticipants: 4,
      },
    });
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User added to class successfully',
      booking: mockBooking,
    });
  });
  
  test('should return 400 if scheduleId or userId is missing', async () => {
    mockRequest.body = { userId: 'user-123' }; // Missing scheduleId
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Schedule ID and User ID are required',
    });
    
    mockRequest.body = { scheduleId: 'schedule-123' }; // Missing userId
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Schedule ID and User ID are required',
    });
  });
  
  test('should return 404 if schedule is not found', async () => {
    mockRequest.body = {
      scheduleId: 'schedule-123',
      userId: 'user-123',
    };
    
    (prisma.schedule.findUnique as jest.Mock).mockResolvedValue(null);
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Schedule not found',
    });
  });
  
  test('should return 404 if user is not found', async () => {
    mockRequest.body = {
      scheduleId: 'schedule-123',
      userId: 'user-123',
    };
    
    (prisma.schedule.findUnique as jest.Mock).mockResolvedValue(mockSchedule);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
  
  test('should return 400 if user is already booked', async () => {
    mockRequest.body = {
      scheduleId: 'schedule-123',
      userId: 'user-123',
    };
    
    (prisma.schedule.findUnique as jest.Mock).mockResolvedValue(mockSchedule);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue({
      id: 'booking-123',
      scheduleId: 'schedule-123',
      userId: 'user-123',
    });
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'User is already booked for this class',
    });
  });
  
  test('should return 400 if class is at capacity', async () => {
    const fullSchedule = {
      ...mockSchedule,
      capacity: 3,
      currentParticipants: 3,
    };
    
    mockRequest.body = {
      scheduleId: 'schedule-123',
      userId: 'user-123',
    };
    
    (prisma.schedule.findUnique as jest.Mock).mockResolvedValue(fullSchedule);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'This class is at full capacity',
    });
  });
  
  test('should handle errors correctly', async () => {
    mockRequest.body = {
      scheduleId: 'schedule-123',
      userId: 'user-123',
    };
    
    (prisma.schedule.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    await adminAddUserToClass(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Failed to add user to class',
    });
  });
});