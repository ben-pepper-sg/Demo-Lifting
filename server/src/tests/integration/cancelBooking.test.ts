import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';

// Create a prisma client for testing
const prisma = new PrismaClient();

describe('Cancel Booking Feature', () => {
  let token: string;
  let userId: string;
  let scheduleId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'cancel.test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Cancel',
        lastName: 'Test',
        role: 'USER',
      },
    });

    userId = user.id;

    // Create a JWT token for authentication
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create a coach user
    const coach = await prisma.user.create({
      data: {
        email: 'coach.cancel@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Coach',
        lastName: 'Cancel',
        role: 'COACH',
      },
    });

    // Create a schedule with some participants
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow

    const schedule = await prisma.schedule.create({
      data: {
        date: scheduleDate,
        time: '10:00',
        capacity: 8,
        currentParticipants: 4, // Start with 4 participants
        workoutType: 'UPPER',
        coachId: coach.id,
      },
    });

    scheduleId = schedule.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany({
      where: { userId },
    });
    await prisma.schedule.delete({
      where: { id: scheduleId },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['cancel.test@example.com', 'coach.cancel@example.com'],
        },
      },
    });
  });

  describe('Cancelling a booking', () => {
    it('should book a time slot successfully', async () => {
      const response = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time slot booked successfully');
      
      // Verify the current participants increased
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(5); // 4 + 1
    });

    it('should not allow cancellation without authentication', async () => {
      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`);

      expect(response.status).toBe(401); // Unauthorized
    });

    it('should decrease the current participants count when cancelling a booking', async () => {
      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking cancelled successfully');
      
      // Verify the current participants decreased
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(4); // Back to 4
    });

    it('should allow booking again after cancellation', async () => {
      // Book again
      const bookResponse = await request(app)
        .post(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(bookResponse.status).toBe(200);
      
      // Verify current participants increased
      let updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(5);

      // Cancel again
      const cancelResponse = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(cancelResponse.status).toBe(200);
      
      // Verify current participants decreased
      updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(4);
    });

    it('should not decrease participants below 0', async () => {
      // Set the current participants to 0 manually
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { currentParticipants: 0 },
      });

      // Try to cancel a non-existent booking
      const response = await request(app)
        .delete(`/api/schedule/${scheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404); // Booking not found
      
      // Verify the current participants is still 0
      const updatedSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      });
      expect(updatedSchedule?.currentParticipants).toBe(0);
    });
  });
});