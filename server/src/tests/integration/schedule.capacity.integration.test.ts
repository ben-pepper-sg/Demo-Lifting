import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../testApp';
import { prisma } from '../../lib/prisma';

describe('Schedule Capacity Integration Tests', () => {
  let token: string;
  let userId: string;
  let scheduleId: string;
  let coachId: string;

  beforeAll(async () => {
    try {
      // Create a test user
      const user = await prisma.user.create({
        data: {
          email: 'capacity.test@example.com',
          passwordHash: 'hashedpassword123',
          firstName: 'Capacity',
          lastName: 'Test',
          role: 'USER',
        },
      });

      userId = user.id;

      // Create a JWT token for authentication
      token = jwt.sign(
        { userId: userId, email: 'capacity.test@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Create a coach user
      const coach = await prisma.user.create({
        data: {
          email: 'coach.capacity@example.com',
          passwordHash: 'hashedpassword123',
          firstName: 'Coach',
          lastName: 'Capacity',
          role: 'COACH',
        },
      });
      coachId = coach.id;

      // Create a schedule with limited capacity for testing
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow

      const schedule = await prisma.schedule.create({
        data: {
          date: scheduleDate,
          time: '10:00',
          capacity: 2, // Small capacity for easier testing
          currentParticipants: 0,
          workoutType: 'UPPER',
          coachId: coachId,
        },
      });

      scheduleId = schedule.id;
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await prisma.booking.deleteMany({
        where: { scheduleId },
      });

      await prisma.schedule.delete({
        where: { id: scheduleId },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['capacity.test@example.com', 'coach.capacity@example.com'],
          },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    // Reset schedule state before each test
    await prisma.booking.deleteMany({
      where: { scheduleId },
    });

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { currentParticipants: 0 },
    });
  });

  describe('Capacity Enforcement', () => {
    it('should allow booking when capacity is available', async () => {
      const response = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time slot booked successfully');

      // Verify the current participants increased
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(1);
    });

    it('should prevent booking when at full capacity', async () => {
      // Fill the class to capacity (2 participants)
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { currentParticipants: 2 },
      });

      const response = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('This class is at full capacity');

      // Verify participants count didn't change
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(2);
    });

    it('should prevent double booking by the same user', async () => {
      // First booking should succeed
      const firstResponse = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(firstResponse.status).toBe(200);

      // Second booking by same user should fail
      const secondResponse = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toBe('You are already booked for this time slot');

      // Verify participants count is still 1
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(1);
    });
  });

  describe('Concurrent Booking Scenarios', () => {
    it('should handle multiple users booking simultaneously', async () => {
      // Create additional users for concurrent testing
      const users = [];
      const tokens = [];

      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `concurrent${i}@example.com`,
            passwordHash: 'hashedpassword123',
            firstName: `User${i}`,
            lastName: 'Concurrent',
            role: 'USER',
          },
        });
        users.push(user);

        const userToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );
        tokens.push(userToken);
      }

      try {
        // Attempt concurrent bookings (3 users, but capacity is only 2)
        const bookingPromises = tokens.map(userToken =>
          request(app)
            .post(`/api/schedule/${scheduleId}/book`)
            .set('Authorization', `Bearer ${userToken}`)
        );

        const responses = await Promise.all(bookingPromises);

        // Count successful and failed bookings
        const successfulBookings = responses.filter(r => r.status === 200);
        const failedBookings = responses.filter(r => r.status === 400);

        // Should have exactly 2 successful bookings (capacity limit)
        expect(successfulBookings.length).toBe(2);
        expect(failedBookings.length).toBe(1);

        // Verify final state
        const finalSchedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
          include: { bookings: true },
        });

        expect(finalSchedule?.currentParticipants).toBe(2);
        expect(finalSchedule?.bookings.length).toBe(2);

        // Failed booking should have capacity error
        const failedResponse = failedBookings[0];
        expect(failedResponse.body.error).toBe('This class is at full capacity');

      } finally {
        // Clean up concurrent test users
        await prisma.user.deleteMany({
          where: {
            id: { in: users.map(u => u.id) },
          },
        });
      }
    });

    it('should handle rapid booking and cancellation cycles', async () => {
      // Create additional user for testing
      const user2 = await prisma.user.create({
        data: {
          email: 'rapid.test@example.com',
          passwordHash: 'hashedpassword123',
          firstName: 'Rapid',
          lastName: 'Test',
          role: 'USER',
        },
      });

      const token2 = jwt.sign(
        { userId: user2.id, email: user2.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      try {
        // Book and cancel rapidly
        for (let i = 0; i < 5; i++) {
          // Book
          const bookResponse = await request(app)
            .post(`/api/schedule/${scheduleId}/book`)
            .set('Authorization', `Bearer ${token}`);
          expect(bookResponse.status).toBe(200);

          // Verify booking exists
          let schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
          });
          expect(schedule?.currentParticipants).toBe(1);

          // Cancel
          const cancelResponse = await request(app)
            .delete(`/api/schedule/${scheduleId}/book`)
            .set('Authorization', `Bearer ${token}`);
          expect(cancelResponse.status).toBe(200);

          // Verify cancellation
          schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
          });
          expect(schedule?.currentParticipants).toBe(0);
        }

        // Final state should be empty
        const finalSchedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
          include: { bookings: true },
        });
        expect(finalSchedule?.currentParticipants).toBe(0);
        expect(finalSchedule?.bookings.length).toBe(0);

      } finally {
        await prisma.user.delete({
          where: { id: user2.id },
        });
      }
    });
  });

  describe('Capacity Boundary Testing', () => {
    it('should handle booking at exact capacity boundary', async () => {
      // Create additional user
      const user2 = await prisma.user.create({
        data: {
          email: 'boundary.test@example.com',
          passwordHash: 'hashedpassword123',
          firstName: 'Boundary',
          lastName: 'Test',
          role: 'USER',
        },
      });

      const token2 = jwt.sign(
        { userId: user2.id, email: user2.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      try {
        // Book first slot
        const response1 = await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token}`);
        expect(response1.status).toBe(200);

        // Book second slot (should reach capacity)
        const response2 = await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token2}`);
        expect(response2.status).toBe(200);

        // Verify at capacity
        let schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(2);

        // Third booking should fail
        const user3 = await prisma.user.create({
          data: {
            email: 'overflow.test@example.com',
            passwordHash: 'hashedpassword123',
            firstName: 'Overflow',
            lastName: 'Test',
            role: 'USER',
          },
        });

        const token3 = jwt.sign(
          { userId: user3.id, email: user3.email },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        const response3 = await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token3}`);
        
        expect(response3.status).toBe(400);
        expect(response3.body.error).toBe('This class is at full capacity');

        // Verify capacity unchanged
        schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(2);

        // Clean up user3
        await prisma.user.delete({ where: { id: user3.id } });

      } finally {
        await prisma.user.delete({ where: { id: user2.id } });
      }
    });

    it('should handle cancellation effects on capacity correctly', async () => {
      // Create additional user
      const user2 = await prisma.user.create({
        data: {
          email: 'cancel.capacity@example.com',
          passwordHash: 'hashedpassword123',
          firstName: 'Cancel',
          lastName: 'Capacity',
          role: 'USER',
        },
      });

      const token2 = jwt.sign(
        { userId: user2.id, email: user2.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      try {
        // Fill to capacity
        await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token}`);
        
        await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token2}`);

        // Verify at capacity
        let schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(2);

        // Cancel one booking
        const cancelResponse = await request(app)
          .delete(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token}`);
        expect(cancelResponse.status).toBe(200);

        // Verify capacity reduced
        schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(1);

        // Should now be able to book again
        const newBookResponse = await request(app)
          .post(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token}`);
        expect(newBookResponse.status).toBe(200);

        // Verify back at capacity
        schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(2);

      } finally {
        await prisma.user.delete({ where: { id: user2.id } });
      }
    });
  });

  describe('Data Integrity Scenarios', () => {
    it('should maintain data consistency during failures', async () => {
      const startingSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: { bookings: true },
      });

      // Attempt booking with invalid token
      const invalidResponse = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidResponse.status).toBe(401);

      // Verify no changes to schedule state
      const endingSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: { bookings: true },
      });

      expect(endingSchedule?.currentParticipants).toBe(startingSchedule?.currentParticipants);
      expect(endingSchedule?.bookings.length).toBe(startingSchedule?.bookings.length);
    });

    it('should handle cancellation of non-existent booking gracefully', async () => {
      // Try to cancel booking that doesn't exist
      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Booking not found');

      // Verify schedule state unchanged
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(schedule?.currentParticipants).toBe(0);
    });

    it('should prevent currentParticipants from going below zero', async () => {
      // Manually set currentParticipants to 0 (data integrity issue scenario)
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { currentParticipants: 0 },
      });

      // Create a booking directly in database (simulating inconsistent state)
      const directBooking = await prisma.booking.create({
        data: {
          scheduleId,
          userId,
          workoutType: 'UPPER',
        },
      });

      try {
        // Try to cancel the booking
        const response = await request(app)
          .delete(`/api/schedule/${scheduleId}/book`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);

        // Verify currentParticipants didn't go below 0
        const schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        expect(schedule?.currentParticipants).toBe(0); // Should stay at 0, not go negative
      } finally {
        // Clean up the direct booking if it still exists
        try {
          await prisma.booking.delete({
            where: { id: directBooking.id },
          });
        } catch (error) {
          // Booking might have been deleted by the cancel operation
        }
      }
    });
  });
});
