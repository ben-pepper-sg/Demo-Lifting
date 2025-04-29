import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

describe('Friday/Saturday Booking Feature', () => {
  let token: string;
  let userId: string;
  let fridayScheduleId: string;
  let mondayScheduleId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test.booking@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
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
        email: 'coach.test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Coach',
        lastName: 'Test',
        role: 'COACH',
      },
    });

    // Create a Friday schedule (day of week = 5)
    const fridayDate = new Date();
    while (fridayDate.getDay() !== 5) {
      fridayDate.setDate(fridayDate.getDate() + 1);
    }

    const fridaySchedule = await prisma.schedule.create({
      data: {
        date: fridayDate,
        time: '09:00',
        capacity: 8,
        currentParticipants: 0,
        workoutType: 'UPPER', // Default workout type
        coachId: coach.id,
      },
    });

    fridayScheduleId = fridaySchedule.id;

    // Create a Monday schedule (day of week = 1)
    const mondayDate = new Date();
    while (mondayDate.getDay() !== 1) {
      mondayDate.setDate(mondayDate.getDate() + 1);
    }

    const mondaySchedule = await prisma.schedule.create({
      data: {
        date: mondayDate,
        time: '09:00',
        capacity: 8,
        currentParticipants: 0,
        workoutType: 'UPPER',
        coachId: coach.id,
      },
    });

    mondayScheduleId = mondaySchedule.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany({
      where: { userId },
    });
    await prisma.schedule.deleteMany({
      where: {
        id: {
          in: [fridayScheduleId, mondayScheduleId],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.booking@example.com', 'coach.test@example.com'],
        },
      },
    });
  });

  describe('Booking time slot', () => {
    it('should require workout type selection for Friday', async () => {
      const response = await request(app)
        .post(`/api/schedule/${fridayScheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Please select a workout type');
      expect(response.body.requiresWorkoutType).toBe(true);
    });

    it('should allow booking with workout type for Friday', async () => {
      const response = await request(app)
        .post(`/api/schedule/${fridayScheduleId}/book`)
        .set('Authorization', `Bearer ${token}`)
        .send({ workoutType: 'LOWER' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time slot booked successfully');
      expect(response.body.booking.workoutType).toBe('LOWER');
    });

    it('should not require workout type selection for Monday', async () => {
      const response = await request(app)
        .post(`/api/schedule/${mondayScheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Time slot booked successfully');
      expect(response.body.booking.workoutType).toBeUndefined();
    });

    it('should reject invalid workout type', async () => {
      // Cancel the previous booking first
      await request(app)
        .delete(`/api/schedule/${fridayScheduleId}/book`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .post(`/api/schedule/${fridayScheduleId}/book`)
        .set('Authorization', `Bearer ${token}`)
        .send({ workoutType: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid workout type');
    });
  });
});