import express from 'express';
import request from 'supertest';
import workoutRoutes from '../../routes/workout.routes';
import { mockPrisma, createTestApp, authenticatedRequest, mockWorkout } from '../../utils/testUtils';

describe('Workout API Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp(workoutRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all workouts', async () => {
      mockPrisma.workout.findMany.mockResolvedValueOnce([mockWorkout]);

      const res = await authenticatedRequest(app, '1')
        .get('/');

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(mockWorkout.id);
    });
  });

  describe('GET /:id', () => {
    it('should return a workout by id', async () => {
      mockPrisma.workout.findUnique.mockResolvedValueOnce(mockWorkout);

      const res = await authenticatedRequest(app, '1')
        .get(`/${mockWorkout.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockWorkout.id);
      expect(res.body.title).toBe(mockWorkout.title);
    });

    it('should return 404 if workout not found', async () => {
      mockPrisma.workout.findUnique.mockResolvedValueOnce(null);

      const res = await authenticatedRequest(app, '1')
        .get('/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /', () => {
    it('should create a new workout', async () => {
      const workoutData = {
        title: 'New Workout',
        description: 'Workout description',
        exercises: [{ name: 'Push-ups', sets: 3, reps: 10 }],
      };

      mockPrisma.workout.create.mockResolvedValueOnce({
        id: '2',
        ...workoutData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authenticatedRequest(app, '1', true) // Only admin can create
        .post('/')
        .send(workoutData);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(workoutData.title);
      expect(mockPrisma.workout.create).toHaveBeenCalledWith({
        data: expect.objectContaining(workoutData),
      });
    });
  });

  describe('PUT /:id', () => {
    it('should update an existing workout', async () => {
      const workoutData = {
        title: 'Updated Workout',
        description: 'Updated description',
      };

      mockPrisma.workout.findUnique.mockResolvedValueOnce(mockWorkout);
      mockPrisma.workout.update.mockResolvedValueOnce({
        ...mockWorkout,
        ...workoutData,
      });

      const res = await authenticatedRequest(app, '1', true) // Only admin can update
        .put(`/${mockWorkout.id}`)
        .send(workoutData);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(workoutData.title);
      expect(mockPrisma.workout.update).toHaveBeenCalledWith({
        where: { id: mockWorkout.id },
        data: expect.objectContaining(workoutData),
      });
    });

    it('should return 404 if workout to update not found', async () => {
      mockPrisma.workout.findUnique.mockResolvedValueOnce(null);

      const res = await authenticatedRequest(app, '1', true)
        .put('/nonexistent-id')
        .send({ title: 'Updated Workout' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(mockPrisma.workout.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a workout', async () => {
      mockPrisma.workout.findUnique.mockResolvedValueOnce(mockWorkout);
      mockPrisma.workout.delete.mockResolvedValueOnce(mockWorkout);

      const res = await authenticatedRequest(app, '1', true) // Only admin can delete
        .delete(`/${mockWorkout.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockWorkout.id);
      expect(mockPrisma.workout.delete).toHaveBeenCalledWith({
        where: { id: mockWorkout.id },
      });
    });

    it('should return 404 if workout to delete not found', async () => {
      mockPrisma.workout.findUnique.mockResolvedValueOnce(null);

      const res = await authenticatedRequest(app, '1', true)
        .delete('/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(mockPrisma.workout.delete).not.toHaveBeenCalled();
    });
  });
});