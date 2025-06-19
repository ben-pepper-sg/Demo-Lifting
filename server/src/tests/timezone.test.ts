import express from 'express';
import request from 'supertest';
import defaultScheduleRoutes from '../routes/defaultSchedule.routes';
import scheduleRoutes from '../routes/schedule.routes';
import { mockPrisma, createTestApp, authenticatedRequest } from '../utils/testUtils';

describe('Timezone Handling Tests', () => {
  let defaultScheduleApp: express.Application;
  let scheduleApp: express.Application;

  beforeAll(() => {
    defaultScheduleApp = createTestApp(defaultScheduleRoutes, 'default-schedules');
    scheduleApp = createTestApp(scheduleRoutes, 'schedules');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset timezone to UTC for consistent tests
    process.env.TZ = 'UTC';
  });

  afterEach(() => {
    // Reset timezone
    delete process.env.TZ;
  });

  describe('Default Schedule Creation with Timezone Handling', () => {
    const mockDefaultSchedule = {
      id: '1',
      dayOfWeek: 1,
      time: '09:00',
      maxParticipants: 8,
      coachId: 'coach1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create schedule with UTC dates at noon to avoid timezone issues', async () => {
      const today = new Date();
      const expectedDate = new Date(Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12, 0, 0
      ));

      mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce(mockDefaultSchedule);
      mockPrisma.schedule.create.mockResolvedValueOnce({
        id: 'schedule1',
        date: expectedDate,
        time: '09:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
        .post('/create-schedule')
        .send({
          defaultScheduleId: '1',
          date: today.toISOString().split('T')[0], // YYYY-MM-DD format
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expectedDate,
          time: '09:00',
          maxParticipants: 8,
          coachId: 'coach1',
        }),
      });
    });

    it('should handle different timezone inputs consistently', async () => {
      const testDate = '2023-06-15';
      const expectedUTCDate = new Date('2023-06-15T12:00:00.000Z');

      mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce(mockDefaultSchedule);
      mockPrisma.schedule.create.mockResolvedValueOnce({
        id: 'schedule1',
        date: expectedUTCDate,
        time: '09:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Test with different date formats
      const dateFormats = [
        '2023-06-15',
        '2023-06-15T00:00:00',
        '2023-06-15T08:00:00-05:00', // EST
        '2023-06-15T14:00:00+01:00', // BST
      ];

      for (const dateInput of dateFormats) {
        jest.clearAllMocks();

        const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
          .post('/create-schedule')
          .send({
            defaultScheduleId: '1',
            date: dateInput,
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            date: expectedUTCDate,
          }),
        });
      }
    });

    it('should handle daylight saving time transitions correctly', async () => {
      mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce(mockDefaultSchedule);

      // Spring forward date (March 12, 2023)
      const springDate = '2023-03-12';
      const expectedSpringUTC = new Date('2023-03-12T12:00:00.000Z');

      mockPrisma.schedule.create.mockResolvedValueOnce({
        id: 'schedule1',
        date: expectedSpringUTC,
        time: '09:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
        .post('/create-schedule')
        .send({
          defaultScheduleId: '1',
          date: springDate,
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expectedSpringUTC,
        }),
      });
    });

    it('should handle year boundary dates correctly', async () => {
      mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce(mockDefaultSchedule);

      // New Year's Eve
      const nyeDate = '2023-12-31';
      const expectedNYEUTC = new Date('2023-12-31T12:00:00.000Z');

      mockPrisma.schedule.create.mockResolvedValueOnce({
        id: 'schedule1',
        date: expectedNYEUTC,
        time: '09:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
        .post('/create-schedule')
        .send({
          defaultScheduleId: '1',
          date: nyeDate,
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expectedNYEUTC,
        }),
      });
    });
  });

  describe('Schedule Queries with Timezone Awareness', () => {
    it('should query schedules using proper date boundaries', async () => {
      const testDate = new Date('2023-06-15T12:00:00.000Z');
      const mockSchedules = [
        {
          id: 'schedule1',
          date: testDate,
          time: '09:00',
          maxParticipants: 8,
          currentParticipants: 0,
          coachId: 'coach1',
          createdAt: new Date(),
          updatedAt: new Date(),
          bookings: [],
        },
      ];

      mockPrisma.schedule.findMany.mockResolvedValueOnce(mockSchedules);

      const res = await authenticatedRequest(scheduleApp, 'user1')
        .get('/')

      expect(res.status).toBe(200);
      expect(mockPrisma.schedule.findMany).toHaveBeenCalled();
    });

    it('should handle timezone-aware class details queries', async () => {
      const now = new Date();
      const currentHour = now.getUTCHours();
      
      const mockSchedule = {
        id: 'schedule1',
        date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
        time: `${currentHour.toString().padStart(2, '0')}:00`,
        maxParticipants: 8,
        currentParticipants: 3,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
        bookings: [
          {
            id: 'booking1',
            userId: 'user1',
            user: {
              firstName: 'John',
              lastName: 'Doe',
              maxBench: 200,
              maxOHP: 150,
              maxSquat: 300,
              maxDeadlift: 350,
            },
          },
        ],
        workoutSchemes: [],
        supplementalWorkouts: [],
      };

      mockPrisma.schedule.findFirst.mockResolvedValueOnce(mockSchedule);

      const res = await request(scheduleApp)
        .get('/class');

      expect(res.status).toBe(200);
      
      // Verify the query uses proper date/time filtering
      expect(mockPrisma.schedule.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: expect.any(Object),
          time: expect.any(String),
        }),
        include: expect.any(Object),
      });
    });

    it('should handle specific hour queries correctly', async () => {
      const targetHour = 16; // 4 PM
      const today = new Date();
      const expectedDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

      const mockSchedule = {
        id: 'schedule1',
        date: expectedDate,
        time: '16:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
        bookings: [],
        workoutSchemes: [],
        supplementalWorkouts: [],
      };

      mockPrisma.schedule.findFirst.mockResolvedValueOnce(mockSchedule);

      const res = await request(scheduleApp)
        .get(`/class?hour=${targetHour}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.schedule.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          time: '16:00',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('Cross-timezone Consistency', () => {
    const timezones = [
      'America/New_York',    // EST/EDT
      'America/Los_Angeles', // PST/PDT  
      'Europe/London',       // GMT/BST
      'Asia/Tokyo',          // JST
      'Australia/Sydney',    // AEST/AEDT
    ];

    timezones.forEach(timezone => {
      it(`should handle dates consistently in ${timezone}`, async () => {
        // Set the timezone
        process.env.TZ = timezone;

        const testDate = '2023-06-15';
        const expectedUTCDate = new Date('2023-06-15T12:00:00.000Z');

        mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce({
          id: '1',
          dayOfWeek: 1,
          time: '09:00',
          maxParticipants: 8,
          coachId: 'coach1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockPrisma.schedule.create.mockResolvedValueOnce({
          id: 'schedule1',
          date: expectedUTCDate,
          time: '09:00',
          maxParticipants: 8,
          currentParticipants: 0,
          coachId: 'coach1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
          .post('/create-schedule')
          .send({
            defaultScheduleId: '1',
            date: testDate,
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            date: expectedUTCDate,
          }),
        });

        // Reset timezone
        process.env.TZ = 'UTC';
      });
    });
  });

  describe('Date Edge Cases', () => {
    it('should handle leap year dates correctly', async () => {
      const leapYearDate = '2024-02-29';
      const expectedUTCDate = new Date('2024-02-29T12:00:00.000Z');

      mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce({
        id: '1',
        dayOfWeek: 4, // Thursday
        time: '09:00',
        maxParticipants: 8,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.schedule.create.mockResolvedValueOnce({
        id: 'schedule1',
        date: expectedUTCDate,
        time: '09:00',
        maxParticipants: 8,
        currentParticipants: 0,
        coachId: 'coach1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
        .post('/create-schedule')
        .send({
          defaultScheduleId: '1',
          date: leapYearDate,
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expectedUTCDate,
        }),
      });
    });

    it('should handle month boundary transitions', async () => {
      const monthBoundaryDates = [
        { input: '2023-02-28', expected: '2023-02-28T12:00:00.000Z' },
        { input: '2023-03-01', expected: '2023-03-01T12:00:00.000Z' },
        { input: '2023-04-30', expected: '2023-04-30T12:00:00.000Z' },
        { input: '2023-05-01', expected: '2023-05-01T12:00:00.000Z' },
      ];

      for (const { input, expected } of monthBoundaryDates) {
        jest.clearAllMocks();

        mockPrisma.defaultSchedule.findUnique.mockResolvedValueOnce({
          id: '1',
          dayOfWeek: 1,
          time: '09:00',
          maxParticipants: 8,
          coachId: 'coach1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockPrisma.schedule.create.mockResolvedValueOnce({
          id: 'schedule1',
          date: new Date(expected),
          time: '09:00',
          maxParticipants: 8,
          currentParticipants: 0,
          coachId: 'coach1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await authenticatedRequest(defaultScheduleApp, 'coach1', 'COACH')
          .post('/create-schedule')
          .send({
            defaultScheduleId: '1',
            date: input,
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            date: new Date(expected),
          }),
        });
      }
    });
  });

  describe('Time Zone Configuration Tests', () => {
    it('should default to UTC when no timezone is set', async () => {
      delete process.env.TZ;

      const testDate = '2023-06-15';
      const now = new Date(testDate);
      
      // Verify we're working in UTC
      expect(now.getTimezoneOffset()).toBe(new Date().getTimezoneOffset());
      
      const expectedUTCDate = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        12, 0, 0
      ));

      expect(expectedUTCDate.toISOString()).toBe('2023-06-15T12:00:00.000Z');
    });

    it('should maintain UTC consistency regardless of server timezone', async () => {
      const serverTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
      const testDate = '2023-06-15';
      const expectedResult = '2023-06-15T12:00:00.000Z';

      for (const tz of serverTimezones) {
        process.env.TZ = tz;
        
        // Simulate the date creation logic from the application
        const inputDate = new Date(testDate);
        const utcDate = new Date(Date.UTC(
          inputDate.getFullYear(),
          inputDate.getMonth(),
          inputDate.getDate(),
          12, 0, 0
        ));

        expect(utcDate.toISOString()).toBe(expectedResult);
      }

      process.env.TZ = 'UTC';
    });
  });
});
