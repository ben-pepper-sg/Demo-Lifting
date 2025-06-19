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
  workoutScheme: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workoutLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  schedule: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  defaultSchedule: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
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
export const createTestApp = (router: express.Router, prefix: string = '') => {
  const app = express();
  app.use(express.json());
  // Use the router with appropriate prefix
  if (prefix === 'auth') {
    app.use('/api/auth', router);
  } else if (prefix === 'admin') {
    app.use('/api/admin', router);
  } else if (prefix === 'workouts') {
    app.use('/api/workouts', router);
  } else {
    app.use('/api', router);
  }
  return app;
};

// Create authenticated request
export const authenticatedRequest = (app: express.Application, userId: string, isAdmin: boolean = false) => {
  const token = generateTestToken(userId, isAdmin);
  // Return a function that accepts the method and endpoint and sets the Authorization header
  return (method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) => {
    const req = request(app)[method](endpoint);
    req.set('Authorization', `Bearer ${token}`);
    if (data) {
      return req.send(data);
    }
    return req;
  };
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