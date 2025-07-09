import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { createMockPrisma } from '../helpers/testDatabase';

// Mock the prisma instance
const mockPrisma = createMockPrisma();

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Cancel Booking Feature', () => {
  let token: string;
  let userId: string;
  let scheduleId: string;

  beforeAll(async () => {
    // Setup test data
    userId = 'test-user-id';
    scheduleId = 'test-schedule-id';
    
    // Create JWT token
    token = jwt.sign(
      { userId, role: 'USER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Mock user creation
    mockPrisma.user.create.mockResolvedValue({
      id: userId,
      email: 'cancel.test@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'Cancel',
      lastName: 'Test',
      role: 'USER',
    });

    // Mock schedule creation
    mockPrisma.schedule.create.mockResolvedValue({
      id: scheduleId,
      date: new Date(),
      time: '09:00',
      maxParticipants: 10,
      currentParticipants: 0,
      isActive: true,
      dayOfWeek: 'MONDAY',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // No real cleanup needed with mock
  });

  describe('Cancelling a booking', () => {
    it('should book a time slot successfully', async () => {
      // Mock schedule lookup
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 0,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      // Mock booking creation
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking-id',
        userId,
        scheduleId,
        createdAt: new Date(),
      });

      // Mock booking check (no existing booking)
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      // Mock schedule update
      mockPrisma.schedule.update.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 1,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      const response = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time slot booked successfully');
      expect(mockPrisma.booking.create).toHaveBeenCalled();
    });

    it('should decrease the current participants count when cancelling a booking', async () => {
      // Mock schedule lookup
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 1,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      // Mock existing booking
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking-id',
        userId,
        scheduleId,
        createdAt: new Date(),
      });

      // Mock booking deletion
      mockPrisma.booking.delete.mockResolvedValue({
        id: 'booking-id',
        userId,
        scheduleId,
        createdAt: new Date(),
      });

      // Mock schedule update
      mockPrisma.schedule.update.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 0,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking cancelled successfully');
      expect(mockPrisma.booking.delete).toHaveBeenCalled();
    });

    it('should not decrease participants below 0', async () => {
      // Mock schedule with 0 participants
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 0,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      // Mock existing booking
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking-id',
        userId,
        scheduleId,
        createdAt: new Date(),
      });

      // Mock booking deletion
      mockPrisma.booking.delete.mockResolvedValue({
        id: 'booking-id',
        userId,
        scheduleId,
        createdAt: new Date(),
      });

      // Mock schedule update to keep participants at 0
      mockPrisma.schedule.update.mockResolvedValue({
        id: scheduleId,
        date: new Date(),
        time: '09:00',
        maxParticipants: 10,
        currentParticipants: 0,
        isActive: true,
        dayOfWeek: 'MONDAY',
      });

      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: { currentParticipants: 0 },
      });
    });
  });
});
