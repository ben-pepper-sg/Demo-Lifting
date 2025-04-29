import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

describe('Cancel Booking Feature', () => {
  let token: string;
  let userId: string;
  let scheduleId: string;

  beforeAll(async () => {
    try {
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
      console.log('Test user created with ID:', userId);
    } catch (error) {
      console.log('Error creating test user:', error);
      // Create a fallback ID
      userId = 'test-user-id-' + Date.now().toString();
      console.log('Using fallback user ID:', userId);
    }

    // Create a JWT token for authentication
    token = jwt.sign(
      { userId: userId, email: 'cancel.test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    let coachId = '';
    
    try {
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
      coachId = coach.id;
      console.log('Coach created with ID:', coachId);
    } catch (error) {
      console.log('Error creating coach:', error);
      coachId = 'coach-id-' + Date.now().toString();
      console.log('Using fallback coach ID:', coachId);
    }

    // Create a schedule with some participants
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow

    try {
      const schedule = await prisma.schedule.create({
        data: {
          date: scheduleDate,
          time: '10:00',
          capacity: 8,
          currentParticipants: 4, // Start with 4 participants
          workoutType: 'UPPER',
          coachId: coachId,
        },
      });

      scheduleId = schedule.id;
      console.log('Schedule created with ID:', scheduleId);
    } catch (error) {
      console.log('Error creating schedule:', error);
      scheduleId = 'schedule-id-' + Date.now().toString();
      console.log('Using fallback schedule ID:', scheduleId);
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data - find bookings first
      const bookings = await prisma.booking.findMany({
        where: { userId },
      });
      
      // Delete each booking individually
      for (const booking of bookings) {
        await prisma.booking.delete({
          where: { id: booking.id },
        });
      }

      // Try to delete schedule if it exists
      try {
        const schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        });
        if (schedule) {
          await prisma.schedule.delete({
            where: { id: scheduleId },
          });
        }
      } catch (error) {
        console.log('Error deleting schedule:', error);
      }

      // Find and delete users
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: ['cancel.test@example.com', 'coach.cancel@example.com'],
          },
        },
      });
      
      for (const user of users) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    } catch (error) {
      console.log('Error in cleanup:', error);
    } finally {
      await prisma.$disconnect();
    }
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