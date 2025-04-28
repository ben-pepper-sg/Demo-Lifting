import { Request, Response } from 'express';
import { PrismaClient, WorkoutCategory, BodyPart } from '@prisma/client';

// Mock the prisma import before importing the controller
const mockPrisma = {
  supplementalWorkout: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock WorkoutCategory and BodyPart enums
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  WorkoutCategory: { UPPER: 'UPPER', LOWER: 'LOWER' },
  BodyPart: { BICEPS: 'BICEPS', TRICEPS: 'TRICEPS', BACK: 'BACK', SHOULDERS: 'SHOULDERS', CHEST: 'CHEST', CALVES: 'CALVES', QUADS: 'QUADS', HAMSTRINGS: 'HAMSTRINGS', GLUTES: 'GLUTES' }
}));

jest.mock('../index', () => ({
  prisma: mockPrisma,
}));

// Import the controller after mocking
import * as supplementalWorkoutController from '../controllers/supplementalWorkout.controller';

// Mock Request and Response
const mockRequest = () => {
  const req: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    user: { userId: 'test-user-id', role: 'ADMIN' },
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('Supplemental Workout Controller', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getAllSupplementalWorkouts', () => {
    it('should return all supplemental workouts', async () => {
      const mockWorkouts = [
        { id: '1', name: 'Bicep Curl', category: 'UPPER', bodyPart: 'BICEPS' },
        { id: '2', name: 'Squat', category: 'LOWER', bodyPart: 'QUADS' },
      ];

      mockPrisma.supplementalWorkout.findMany.mockResolvedValue(mockWorkouts);

      await supplementalWorkoutController.getAllSupplementalWorkouts(req, res);

      expect(mockPrisma.supplementalWorkout.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ supplementalWorkouts: mockWorkouts });
    });

    it('should handle errors', async () => {
      mockPrisma.supplementalWorkout.findMany.mockRejectedValue(new Error('Database error'));

      await supplementalWorkoutController.getAllSupplementalWorkouts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('createSupplementalWorkout', () => {
    it('should create a new supplemental workout', async () => {
      const newWorkout = {
        name: 'Bicep Curl',
        category: WorkoutCategory.UPPER,
        bodyPart: BodyPart.BICEPS,
        description: 'Curl with dumbbells',
      };

      req.body = newWorkout;

      const createdWorkout = { id: '1', ...newWorkout, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.supplementalWorkout.create.mockResolvedValue(createdWorkout);

      await supplementalWorkoutController.createSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.create).toHaveBeenCalledWith({
        data: newWorkout,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Supplemental workout created successfully',
        supplementalWorkout: createdWorkout,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { name: 'Bicep Curl' }; // Missing category and bodyPart

      await supplementalWorkoutController.createSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('updateSupplementalWorkout', () => {
    it('should update an existing supplemental workout', async () => {
      const updateData = {
        name: 'Updated Bicep Curl',
        description: 'Updated description',
      };

      req.params = { id: '1' };
      req.body = updateData;

      const existingWorkout = {
        id: '1',
        name: 'Bicep Curl',
        category: 'UPPER',
        bodyPart: 'BICEPS',
        description: 'Curl with dumbbells',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWorkout = { ...existingWorkout, ...updateData, updatedAt: new Date() };

      mockPrisma.supplementalWorkout.findUnique.mockResolvedValue(existingWorkout);
      mockPrisma.supplementalWorkout.update.mockResolvedValue(updatedWorkout);

      await supplementalWorkoutController.updateSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrisma.supplementalWorkout.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Supplemental workout updated successfully',
        supplementalWorkout: updatedWorkout,
      });
    });

    it('should return 404 if the workout to update does not exist', async () => {
      req.params = { id: 'non-existent-id' };
      req.body = { name: 'Updated Workout' };

      mockPrisma.supplementalWorkout.findUnique.mockResolvedValue(null);

      await supplementalWorkoutController.updateSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Supplemental workout not found' }));
    });
  });

  describe('deleteSupplementalWorkout', () => {
    it('should delete an existing supplemental workout', async () => {
      req.params = { id: '1' };

      const existingWorkout = {
        id: '1',
        name: 'Bicep Curl',
        category: 'UPPER',
        bodyPart: 'BICEPS',
      };

      mockPrisma.supplementalWorkout.findUnique.mockResolvedValue(existingWorkout);
      mockPrisma.supplementalWorkout.delete.mockResolvedValue(existingWorkout);

      await supplementalWorkoutController.deleteSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrisma.supplementalWorkout.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Supplemental workout deleted successfully',
      });
    });

    it('should return 404 if the workout to delete does not exist', async () => {
      req.params = { id: 'non-existent-id' };

      mockPrisma.supplementalWorkout.findUnique.mockResolvedValue(null);

      await supplementalWorkoutController.deleteSupplementalWorkout(req, res);

      expect(mockPrisma.supplementalWorkout.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Supplemental workout not found' }));
    });
  });
});