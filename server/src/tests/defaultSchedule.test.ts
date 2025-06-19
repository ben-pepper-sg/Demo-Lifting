import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../utils/testUtils';
import { getAllDefaultSchedules, createScheduleFromDefault, upsertDefaultSchedule, deleteDefaultSchedule } from '../controllers/defaultSchedule.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock JWT
jest.mock('jsonwebtoken');

describe('Default Schedule API', () => {
  let app: express.Application;
  let mockRequest: any;
  let mockResponse: any;

  const mockDefaultSchedule = {
    id: 'default-schedule-1',
    dayOfWeek: 1, // Monday
    time: '09:00',
    capacity: 8,
    workoutType: 'UPPER',
    isActive: true,
    coachId: 'coach-1',
    coach: {
      id: 'coach-1',
      firstName: 'John',
      lastName: 'Coach',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    userId: 'admin-1',
    role: 'ADMIN',
  };

  const mockRegularUser = {
    userId: 'user-1',
    role: 'USER',
  };

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock requests and responses
    mockRequest = {
      body: {},
      params: {},
      user: {},
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/default-schedules/', () => {
    it('should return all active default schedules successfully', async () => {
      // Arrange
      const mockSchedules = [mockDefaultSchedule];
      mockPrisma.defaultSchedule.findMany.mockResolvedValue(mockSchedules);

      // Act
      await getAllDefaultSchedules(mockRequest, mockResponse);

      // Assert
      expect(mockPrisma.defaultSchedule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { time: 'asc' },
        ],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        defaultSchedules: mockSchedules,
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.defaultSchedule.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      await getAllDefaultSchedules(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to get default schedules',
      });
    });
  });

  describe('POST /api/default-schedules/create-schedule', () => {
    beforeEach(() => {
      mockRequest.user = mockRegularUser;
    });

    it('should create schedule from default schedule successfully', async () => {
      // Arrange
      const mockCreatedSchedule = {
        id: 'schedule-1',
        date: new Date('2024-01-01T12:00:00.000Z'),
        time: '09:00',
        capacity: 8,
        coachId: 'coach-1',
        workoutType: 'UPPER',
        coach: mockDefaultSchedule.coach,
      };

      mockRequest.body = {
        defaultScheduleId: 'default-schedule-1',
        date: '2024-01-01', // Monday
      };

      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);
      mockPrisma.schedule.findFirst.mockResolvedValue(null); // No existing schedule
      mockPrisma.schedule.create.mockResolvedValue(mockCreatedSchedule);

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockPrisma.defaultSchedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'default-schedule-1' },
        include: {
          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Schedule created successfully',
        schedule: mockCreatedSchedule,
      });
    });

    it('should return 400 if defaultScheduleId is missing', async () => {
      // Arrange
      mockRequest.body = { date: '2024-01-01' };

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Default schedule ID and date are required',
      });
    });

    it('should return 400 if date is missing', async () => {
      // Arrange
      mockRequest.body = { defaultScheduleId: 'default-schedule-1' };

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Default schedule ID and date are required',
      });
    });

    it('should return 404 if default schedule not found', async () => {
      // Arrange
      mockRequest.body = {
        defaultScheduleId: 'non-existent',
        date: '2024-01-01',
      };
      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(null);

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Default schedule not found',
      });
    });

    it('should return 400 if date day of week does not match default schedule', async () => {
      // Arrange
      mockRequest.body = {
        defaultScheduleId: 'default-schedule-1',
        date: '2024-01-02', // Tuesday, but default is Monday (1)
      };
      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Selected date does not match the day of week for this default schedule',
        requestedDay: 2, // Tuesday
        expectedDay: 1, // Monday
      });
    });

    it('should return 409 if schedule already exists for that date and time', async () => {
      // Arrange
      const existingSchedule = { id: 'existing-schedule-1' };
      mockRequest.body = {
        defaultScheduleId: 'default-schedule-1',
        date: '2024-01-01',
      };

      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);
      mockPrisma.schedule.findFirst.mockResolvedValue(existingSchedule);

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'A schedule already exists for this date and time',
        scheduleId: 'existing-schedule-1',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockRequest.body = {
        defaultScheduleId: 'default-schedule-1',
        date: '2024-01-01',
      };
      mockPrisma.defaultSchedule.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      await createScheduleFromDefault(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to create schedule',
      });
    });
  });

  describe('POST /api/default-schedules/admin', () => {
    beforeEach(() => {
      mockRequest.user = mockAdminUser;
    });

    it('should create new default schedule successfully', async () => {
      // Arrange
      const newDefaultSchedule = {
        ...mockDefaultSchedule,
        id: 'new-default-schedule',
      };

      mockRequest.body = {
        dayOfWeek: 1,
        time: '09:00',
        capacity: 8,
        workoutType: 'UPPER',
        coachId: 'coach-1',
        isActive: true,
      };

      mockPrisma.defaultSchedule.upsert.mockResolvedValue(newDefaultSchedule);

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockPrisma.defaultSchedule.upsert).toHaveBeenCalledWith({
        where: { id: '' },
        update: {
          dayOfWeek: 1,
          time: '09:00',
          capacity: 8,
          workoutType: 'UPPER',
          coachId: 'coach-1',
          isActive: true,
        },
        create: {
          dayOfWeek: 1,
          time: '09:00',
          capacity: 8,
          workoutType: 'UPPER',
          coachId: 'coach-1',
          isActive: true,
        },
        include: {
          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Default schedule created successfully',
        defaultSchedule: newDefaultSchedule,
      });
    });

    it('should update existing default schedule successfully', async () => {
      // Arrange
      const updatedDefaultSchedule = {
        ...mockDefaultSchedule,
        time: '10:00',
      };

      mockRequest.body = {
        id: 'default-schedule-1',
        dayOfWeek: 1,
        time: '10:00',
        capacity: 8,
        workoutType: 'UPPER',
        coachId: 'coach-1',
        isActive: true,
      };

      mockPrisma.defaultSchedule.upsert.mockResolvedValue(updatedDefaultSchedule);

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Default schedule updated successfully',
        defaultSchedule: updatedDefaultSchedule,
      });
    });

    it('should use admin userId as coachId if not provided', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 1,
        time: '09:00',
        workoutType: 'UPPER',
      };

      mockPrisma.defaultSchedule.upsert.mockResolvedValue(mockDefaultSchedule);

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockPrisma.defaultSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            coachId: 'admin-1',
          }),
          update: expect.objectContaining({
            coachId: 'admin-1',
          }),
        })
      );
    });

    it('should return 400 if dayOfWeek is missing', async () => {
      // Arrange
      mockRequest.body = {
        time: '09:00',
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Day of week, time, and workout type are required',
      });
    });

    it('should return 400 if time is missing', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 1,
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Day of week, time, and workout type are required',
      });
    });

    it('should return 400 if workoutType is missing', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 1,
        time: '09:00',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Day of week, time, and workout type are required',
      });
    });

    it('should return 400 if dayOfWeek is invalid (less than 0)', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: -1,
        time: '09:00',
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      });
    });

    it('should return 400 if dayOfWeek is invalid (greater than 6)', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 7,
        time: '09:00',
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      });
    });

    it('should return 400 if time format is invalid', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 1,
        time: '25:00', // Invalid hour
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Time must be in HH:MM format',
      });
    });

    it('should return 400 if no coachId and no user in request', async () => {
      // Arrange
      mockRequest.user = null;
      mockRequest.body = {
        dayOfWeek: 1,
        time: '09:00',
        workoutType: 'UPPER',
      };

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Coach ID is required',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockRequest.body = {
        dayOfWeek: 1,
        time: '09:00',
        workoutType: 'UPPER',
      };
      mockPrisma.defaultSchedule.upsert.mockRejectedValue(new Error('Database error'));

      // Act
      await upsertDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to create/update default schedule',
      });
    });
  });

  describe('DELETE /api/default-schedules/admin/:id', () => {
    beforeEach(() => {
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: 'default-schedule-1' };
    });

    it('should delete default schedule successfully', async () => {
      // Arrange
      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);
      mockPrisma.defaultSchedule.delete.mockResolvedValue(mockDefaultSchedule);

      // Act
      await deleteDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockPrisma.defaultSchedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'default-schedule-1' },
      });
      expect(mockPrisma.defaultSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'default-schedule-1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Default schedule deleted successfully',
      });
    });

    it('should return 404 if default schedule not found', async () => {
      // Arrange
      mockPrisma.defaultSchedule.findUnique.mockResolvedValue(null);

      // Act
      await deleteDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Default schedule not found',
      });
      expect(mockPrisma.defaultSchedule.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.defaultSchedule.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      await deleteDefaultSchedule(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to delete default schedule',
      });
    });
  });

  describe('Authentication and Authorization Integration Tests', () => {
    beforeEach(() => {
      // Setup Express app with routes for integration tests
      app = express();
      app.use(express.json());
      
      // Mock the controllers to just return success for integration tests
      app.get('/api/default-schedules/', getAllDefaultSchedules);
      app.post('/api/default-schedules/create-schedule', authenticate, createScheduleFromDefault);
      app.post('/api/default-schedules/admin', authenticate, authorizeAdmin, upsertDefaultSchedule);
      app.delete('/api/default-schedules/admin/:id', authenticate, authorizeAdmin, deleteDefaultSchedule);
    });

    describe('GET /api/default-schedules/', () => {
      it('should allow unauthenticated access', async () => {
        // Arrange
        mockPrisma.defaultSchedule.findMany.mockResolvedValue([]);

        // Act & Assert
        const response = await request(app)
          .get('/api/default-schedules/')
          .expect(200);

        expect(response.body).toHaveProperty('defaultSchedules');
      });
    });

    describe('POST /api/default-schedules/create-schedule', () => {
      it('should require authentication', async () => {
        // Act & Assert
        await request(app)
          .post('/api/default-schedules/create-schedule')
          .send({
            defaultScheduleId: 'default-schedule-1',
            date: '2024-01-01',
          })
          .expect(401);
      });

      it('should work with valid authentication', async () => {
        // Arrange
        const token = 'valid-token';
        (jwt.verify as jest.Mock).mockReturnValue(mockRegularUser);
        mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);
        mockPrisma.schedule.findFirst.mockResolvedValue(null);
        mockPrisma.schedule.create.mockResolvedValue({
          id: 'schedule-1',
          date: new Date('2024-01-01T12:00:00.000Z'),
          time: '09:00',
          capacity: 8,
          coachId: 'coach-1',
          workoutType: 'UPPER',
          coach: mockDefaultSchedule.coach,
        });

        // Act & Assert
        const response = await request(app)
          .post('/api/default-schedules/create-schedule')
          .set('Authorization', `Bearer ${token}`)
          .send({
            defaultScheduleId: 'default-schedule-1',
            date: '2024-01-01',
          })
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Schedule created successfully');
      });
    });

    describe('POST /api/default-schedules/admin', () => {
      it('should require authentication', async () => {
        // Act & Assert
        await request(app)
          .post('/api/default-schedules/admin')
          .send({
            dayOfWeek: 1,
            time: '09:00',
            workoutType: 'UPPER',
          })
          .expect(401);
      });

      it('should require admin role', async () => {
        // Arrange
        const token = 'valid-token';
        (jwt.verify as jest.Mock).mockReturnValue(mockRegularUser);

        // Act & Assert
        await request(app)
          .post('/api/default-schedules/admin')
          .set('Authorization', `Bearer ${token}`)
          .send({
            dayOfWeek: 1,
            time: '09:00',
            workoutType: 'UPPER',
          })
          .expect(403);
      });

      it('should work with admin authentication', async () => {
        // Arrange
        const token = 'valid-admin-token';
        (jwt.verify as jest.Mock).mockReturnValue(mockAdminUser);
        mockPrisma.defaultSchedule.upsert.mockResolvedValue(mockDefaultSchedule);

        // Act & Assert
        const response = await request(app)
          .post('/api/default-schedules/admin')
          .set('Authorization', `Bearer ${token}`)
          .send({
            dayOfWeek: 1,
            time: '09:00',
            workoutType: 'UPPER',
          })
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Default schedule created successfully');
      });
    });

    describe('DELETE /api/default-schedules/admin/:id', () => {
      it('should require authentication', async () => {
        // Act & Assert
        await request(app)
          .delete('/api/default-schedules/admin/default-schedule-1')
          .expect(401);
      });

      it('should require admin role', async () => {
        // Arrange
        const token = 'valid-token';
        (jwt.verify as jest.Mock).mockReturnValue(mockRegularUser);

        // Act & Assert
        await request(app)
          .delete('/api/default-schedules/admin/default-schedule-1')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('should work with admin authentication', async () => {
        // Arrange
        const token = 'valid-admin-token';
        (jwt.verify as jest.Mock).mockReturnValue(mockAdminUser);
        mockPrisma.defaultSchedule.findUnique.mockResolvedValue(mockDefaultSchedule);
        mockPrisma.defaultSchedule.delete.mockResolvedValue(mockDefaultSchedule);

        // Act & Assert
        const response = await request(app)
          .delete('/api/default-schedules/admin/default-schedule-1')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Default schedule deleted successfully');
      });
    });
  });
});
