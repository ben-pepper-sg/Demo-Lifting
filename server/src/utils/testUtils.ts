import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock PrismaClient
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workout: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  schedule: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock JWT token
export const generateTestToken = (userId: string, isAdmin: boolean = false) => {
  return jwt.sign(
    { id: userId, role: isAdmin ? 'admin' : 'user' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Create test app
export const createTestApp = (router: express.Router) => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
};

// Create authenticated request
export const authenticatedRequest = (app: express.Application, userId: string, isAdmin: boolean = false) => {
  const token = generateTestToken(userId, isAdmin);
  return request(app).set('Authorization', `Bearer ${token}`);
};

// Test data generators
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  password: 'hashedPassword',
  name: 'Test User',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdminUser = {
  id: '2',
  email: 'admin@example.com',
  password: 'hashedPassword',
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockWorkout = {
  id: '1',
  title: 'Test Workout',
  description: 'Test description',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Clean up function for tests
export const cleanupDatabase = () => {
  // Reset mock functions
  jest.clearAllMocks();
};