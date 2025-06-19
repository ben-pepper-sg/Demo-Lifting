import { Request, Response } from 'express';
import { AuthRequest } from '../types';

// Mock Prisma
const mockPrisma = {
  schedule: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock the prisma instance
jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
import { bookTimeSlot, cancelBooking, adminAddUserToClass } from '../controllers/schedule.controller';

describe('Schedule Capacity Management Tests', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'user123', role: 'USER' },
      params: { scheduleId: 'schedule123' },
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Capacity Enforcement', () => {
    test('should prevent booking when class is at full capacity', async () => {
      // Setup: class at full capacity (8/8)
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        date: new Date(),
        time: '16:00',
        capacity: 8,
        currentParticipants: 8, // Full capacity
        workoutType: 'UPPER',
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null); // No existing booking

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'This class is at full capacity',
      });
      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
      expect(mockPrisma.schedule.update).not.toHaveBeenCalled();
    });

    test('should allow booking when class has available capacity', async () => {
      // Setup: class with available space (6/8)
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        date: new Date(),
        time: '16:00',
        capacity: 8,
        currentParticipants: 6,
        workoutType: 'UPPER',
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.booking.create).toHaveBeenCalled();
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 7 }, // 6 + 1
      });
    });

    test('should handle edge case with capacity of 0', async () => {
      // Setup: class with 0 capacity
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        date: new Date(),
        time: '16:00',
        capacity: 0,
        currentParticipants: 0,
        workoutType: 'UPPER',
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'This class is at full capacity',
      });
    });

    test('should handle capacity validation for admin add user', async () => {
      mockRequest.body = { scheduleId: 'schedule123', userId: 'user456' };
      
      // Setup: class at full capacity
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 8,
        bookings: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user456',
        firstName: 'John',
        lastName: 'Doe',
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await adminAddUserToClass(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'This class is at full capacity',
      });
    });
  });

  describe('Booking Conflicts and Race Conditions', () => {
    test('should prevent double booking for the same user', async () => {
      // Setup: user already has a booking
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 3,
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'You are already booked for this time slot',
      });
      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
    });

    test('should handle concurrent booking attempts gracefully', async () => {
      // Simulate race condition where currentParticipants changes between reads
      const scheduleAtCapacity = {
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 7, // One spot left
        bookings: [],
      };

      const scheduleFullAfterUpdate = {
        ...scheduleAtCapacity,
        currentParticipants: 8, // Now full
      };

      // First call finds space, second call finds it full
      mockPrisma.schedule.findUnique
        .mockResolvedValueOnce(scheduleAtCapacity)
        .mockResolvedValueOnce(scheduleFullAfterUpdate);
      
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      // Simulate first user booking successfully
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      // First booking should succeed
      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Reset mocks for second attempt
      jest.clearAllMocks();
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn();

      // Second user tries to book
      mockRequest.user = { userId: 'user456', role: 'USER' };
      mockPrisma.schedule.findUnique.mockResolvedValue(scheduleFullAfterUpdate);
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      // Second booking should fail
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'This class is at full capacity',
      });
    });
  });

  describe('Cancellation Effects on Capacity', () => {
    test('should decrease currentParticipants when cancelling booking', async () => {
      // Setup existing booking and schedule
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        currentParticipants: 5,
        capacity: 8,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await cancelBooking(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'booking123' },
      });
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 4 }, // Math.max(0, 5 - 1)
      });
    });

    test('should not allow currentParticipants to go below 0', async () => {
      // Edge case: currentParticipants is 0 but booking exists
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        currentParticipants: 0,
        capacity: 8,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await cancelBooking(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 0 }, // Math.max(0, 0 - 1) = 0
      });
    });

    test('should handle cancellation when booking does not exist', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        currentParticipants: 5,
        capacity: 8,
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null); // No booking found

      await cancelBooking(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Booking not found',
      });
      expect(mockPrisma.booking.delete).not.toHaveBeenCalled();
      expect(mockPrisma.schedule.update).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    test('should handle undefined or null capacity values', async () => {
      // Schedule with undefined capacity should default to checking against 0
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: null,
        currentParticipants: 1,
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      // Should fail because 1 >= null is truthy in JavaScript
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test('should handle negative currentParticipants values', async () => {
      // Data integrity issue: negative current participants
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 8,
        currentParticipants: -1, // Invalid state
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      // Should allow booking since -1 < 8
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 0 }, // -1 + 1 = 0
      });
    });

    test('should handle very large capacity values', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 999999,
        currentParticipants: 0,
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 1 },
      });
    });

    test('should handle schedule not found scenarios', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Schedule not found',
      });
    });
  });

  describe('Maximum Capacity Validation', () => {
    test('should prevent booking exactly at capacity threshold', async () => {
      // Test boundary condition: exactly at capacity
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 5,
        currentParticipants: 5, // Exactly at capacity
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'This class is at full capacity',
      });
    });

    test('should allow booking one below capacity threshold', async () => {
      // Test boundary condition: one below capacity
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 5,
        currentParticipants: 4, // One below capacity
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 5 }, // Should reach capacity
      });
    });
  });

  describe('Transaction and Concurrency Safety', () => {
    test('should handle database transaction rollback scenarios', async () => {
      // Simulate booking creation success but schedule update failure
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 3,
        bookings: [],
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });
      
      // Simulate schedule update failure
      mockPrisma.schedule.update.mockRejectedValue(new Error('Database connection lost'));

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      // Should still attempt to create booking
      expect(mockPrisma.booking.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    test('should handle capacity checks with stale data scenarios', async () => {
      // Simulate scenario where capacity check shows space but actual booking fails due to concurrency
      const scheduleWithSpace = {
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 7, // One space left
        bookings: [],
      };

      mockPrisma.schedule.findUnique.mockResolvedValue(scheduleWithSpace);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      
      // Simulate booking creation failure due to concurrent booking
      mockPrisma.booking.create.mockRejectedValue(new Error('Unique constraint violation'));

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      // Verify no schedule update was attempted due to booking failure
      expect(mockPrisma.schedule.update).not.toHaveBeenCalled();
    });
  });

  describe('User Authorization and Input Validation', () => {
    test('should handle missing user ID in request', async () => {
      mockRequest.user = undefined;

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      // Function should use default user ID
      expect(mockPrisma.schedule.findUnique).toHaveBeenCalled();
    });

    test('should handle invalid schedule ID', async () => {
      mockRequest.params = { scheduleId: '' };

      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Schedule not found',
      });
    });

    test('should handle malformed request parameters', async () => {
      mockRequest.params = {};

      // This should cause findUnique to be called with undefined scheduleId
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Performance and Load Testing Scenarios', () => {
    test('should handle booking for schedule with many existing bookings', async () => {
      // Simulate a schedule with many bookings but still under capacity
      const manyBookings = Array.from({ length: 100 }, (_, i) => ({
        id: `booking${i}`,
        userId: `user${i}`,
        scheduleId: 'schedule123',
      }));

      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 150, // Large capacity
        currentParticipants: 100,
        bookings: manyBookings,
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking101',
        scheduleId: 'schedule123',
        userId: 'user123',
      });
      // Ensure schedule update succeeds
      mockPrisma.schedule.update.mockResolvedValue({
        id: 'schedule123',
        capacity: 150,
        currentParticipants: 101,
      });

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 101 },
      });
    });

    test('should handle cancellation with complex booking data', async () => {
      // Setup complex scenario with booking that has additional data
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        currentParticipants: 50,
        capacity: 100,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'complex-booking-123',
        scheduleId: 'schedule123',
        userId: 'user123',
        workoutType: 'UPPER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await cancelBooking(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'complex-booking-123' },
      });
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule123' },
        data: { currentParticipants: 49 },
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database timeout scenarios', async () => {
      mockPrisma.schedule.findUnique.mockRejectedValue(new Error('Query timeout'));

      await bookTimeSlot(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to book time slot',
      });
    });

    test('should handle booking deletion failure gracefully', async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        currentParticipants: 5,
        capacity: 8,
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user123',
      });
      
      // Simulate booking deletion failure
      mockPrisma.booking.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await cancelBooking(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      // Schedule should not be updated if booking deletion fails
      expect(mockPrisma.schedule.update).not.toHaveBeenCalled();
    });

    test('should handle partial failure in admin add user function', async () => {
      mockRequest.body = { scheduleId: 'schedule123', userId: 'user456' };
      
      mockPrisma.schedule.findUnique.mockResolvedValue({
        id: 'schedule123',
        capacity: 8,
        currentParticipants: 3,
        bookings: [],
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user456',
        firstName: 'John',
        lastName: 'Doe',
      });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      
      // Booking creation succeeds but schedule update fails
      mockPrisma.booking.create.mockResolvedValue({
        id: 'booking123',
        scheduleId: 'schedule123',
        userId: 'user456',
      });
      mockPrisma.schedule.update.mockRejectedValue(new Error('Update failed'));

      await adminAddUserToClass(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockPrisma.booking.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
