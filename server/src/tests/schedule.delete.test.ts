import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient: any = {
    schedule: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaClient)),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock JWT
jest.mock('jsonwebtoken');

// Mock authentication middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'admin123', role: 'ADMIN' };
    next();
  },
  authorizeAdmin: (req: any, res: any, next: any) => next(),
  authorizeCoach: (req: any, res: any, next: any) => next(),
}));

// Import controller directly to avoid Express router issues in testing
import { deleteSchedule } from '../controllers/schedule.controller';

// Create Express app for testing
const app = express();
app.use(express.json());

// Add test endpoint
app.delete('/api/schedule/:id', deleteSchedule);

describe('Schedule Delete Tests', () => {
  let prisma: any;
  
  beforeAll(() => {
    prisma = new PrismaClient();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should delete a schedule and all its bookings', async () => {
    // Mock schedule with bookings
    const mockSchedule = {
      id: 'schedule123',
      date: new Date(),
      time: '16:00',
      capacity: 8,
      currentParticipants: 2,
      workoutType: 'UPPER',
      bookings: [
        { id: 'booking1', userId: 'user1', scheduleId: 'schedule123' },
        { id: 'booking2', userId: 'user2', scheduleId: 'schedule123' },
      ],
    };
    
    prisma.schedule.findUnique.mockResolvedValue(mockSchedule);
    prisma.booking.deleteMany.mockResolvedValue({ count: 2 });
    prisma.schedule.delete.mockResolvedValue(mockSchedule);
    
    const response = await request(app)
      .delete('/api/schedule/schedule123')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Schedule deleted successfully');
    
    // Verify that deleteMany was called with correct scheduleId
    expect(prisma.booking.deleteMany).toHaveBeenCalledWith({
      where: { scheduleId: 'schedule123' },
    });
    
    // Verify that schedule delete was called with correct ID
    expect(prisma.schedule.delete).toHaveBeenCalledWith({
      where: { id: 'schedule123' },
    });
  });
  
  it('should return 404 if schedule not found', async () => {
    prisma.schedule.findUnique.mockResolvedValue(null);
    
    const response = await request(app)
      .delete('/api/schedule/nonexistent')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Schedule not found');
    
    // Verify that no deletion was attempted
    expect(prisma.booking.deleteMany).not.toHaveBeenCalled();
    expect(prisma.schedule.delete).not.toHaveBeenCalled();
  });
});