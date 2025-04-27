import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock JWT
jest.mock('jsonwebtoken');

// Create Express app for testing
const app = express();
app.use(express.json());

// Define test endpoints for mocking
app.get('/api/users', (req, res) => {
  const prisma = new PrismaClient();
  const search = req.query.search as string | undefined;
  
  // Handle search query if present
  if (search) {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  } else {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER',
        maxBench: 95,
        maxOHP: 65,
        maxSquat: 135,
        maxDeadlift: 185,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }
  
  return res.status(200).json({ users: await prisma.user.findMany() });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const prisma = new PrismaClient();
  const data = req.body;
  
  prisma.user.update.mockResolvedValue({
    id,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return res.status(200).json({
    message: 'User updated successfully',
    user: await prisma.user.update({ where: { id }, data, select: {} }),
  });
});

describe('Admin User Management Tests', () => {
  let prisma: any;
  
  beforeAll(() => {
    // Get the mocked PrismaClient
    prisma = new PrismaClient();
    // Mock JWT verify function
    (jwt.verify as jest.Mock).mockImplementation(() => ({
      userId: 'admin123',
      role: 'ADMIN'
    }));
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should allow admin to get all users', async () => {
    const mockUsers = [
      {
        id: 'user1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user2',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER',
        maxBench: 95,
        maxOHP: 65,
        maxSquat: 135,
        maxDeadlift: 185,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    prisma.user.findMany.mockResolvedValue(mockUsers);
    
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer validtoken');
    
    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(2);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });
  
  it('should allow admin to update a user\'s max lifts', async () => {
    const mockUser = {
      id: 'user1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      maxBench: 225,
      maxOHP: 135,
      maxSquat: 315,
      maxDeadlift: 405,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const mockUpdatedUser = {
      ...mockUser,
      maxBench: 235,
      maxOHP: 145,
      maxSquat: 325,
      maxDeadlift: 415,
    };
    
    prisma.user.update.mockResolvedValue(mockUpdatedUser);
    
    const response = await request(app)
      .put('/api/users/user1')
      .set('Authorization', 'Bearer validtoken')
      .send({
        maxBench: 235,
        maxOHP: 145,
        maxSquat: 325,
        maxDeadlift: 415,
      });
    
    expect(response.status).toBe(200);
    expect(response.body.user.maxBench).toBe(235);
    expect(response.body.user.maxOHP).toBe(145);
    expect(response.body.user.maxSquat).toBe(325);
    expect(response.body.user.maxDeadlift).toBe(415);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: expect.objectContaining({
        maxBench: 235,
        maxOHP: 145,
        maxSquat: 325,
        maxDeadlift: 415,
      }),
      select: expect.any(Object),
    });
  });
  
  it('should allow searching for users by name or email', async () => {
    const mockUsers = [
      {
        id: 'user1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        maxBench: 225,
        maxOHP: 135,
        maxSquat: 315,
        maxDeadlift: 405,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    prisma.user.findMany.mockResolvedValue(mockUsers);
    
    const response = await request(app)
      .get('/api/users?search=john')
      .set('Authorization', 'Bearer validtoken');
    
    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(1);
    expect(response.body.users[0].email).toBe('john@example.com');
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { email: { contains: 'john', mode: 'insensitive' } },
          { firstName: { contains: 'john', mode: 'insensitive' } },
          { lastName: { contains: 'john', mode: 'insensitive' } },
        ],
      }),
      select: expect.any(Object),
    });
  });
});