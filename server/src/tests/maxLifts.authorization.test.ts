import { Request, Response } from 'express';
import { updateMaxLifts } from '../controllers/workout.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Mock the required modules
jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Request and Response
const mockRequest = () => {
  const req: any = {};
  req.body = {};
  req.user = { userId: '1' };
  return req;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.on = jest.fn().mockReturnThis();
  return res;
};

const mockNext = jest.fn();

describe('Max Lifts Authorization', () => {
  const adminUser = {
    id: '1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    maxBench: 225,
    maxOHP: 135,
    maxSquat: 315,
    maxDeadlift: 405,
  };

  const regularUser = {
    id: '2',
    email: 'user@test.com',
    firstName: 'Regular',
    lastName: 'User',
    role: 'USER',
    maxBench: 185,
    maxOHP: 115,
    maxSquat: 225,
    maxDeadlift: 275,
  };

  beforeEach(() => {
    mockPrisma.user.findUnique.mockImplementation((args) => {
      const id = args.where.id;
      if (id === adminUser.id) {
        return Promise.resolve(adminUser);
      } else if (id === regularUser.id) {
        return Promise.resolve(regularUser);
      }
      return Promise.resolve(null);
    });

    mockPrisma.user.update.mockImplementation((args) => {
      const id = args.where.id;
      const data = args.data;

      let user = id === adminUser.id ? { ...adminUser } : { ...regularUser };
      
      // Update max lifts
      user = {
        ...user,
        ...data,
        passwordHash: 'hashedPassword',
      };
      
      return Promise.resolve(user);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authorizeAdmin middleware', () => {
    it('should allow admin to proceed', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.user = { userId: adminUser.id, role: 'ADMIN' };

      // Act
      authorizeAdmin(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access to regular users', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.user = { userId: regularUser.id, role: 'USER' };

      // Act
      authorizeAdmin(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Admin privileges required'
      });
    });

    it('should deny access when no user is present', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.user = undefined;

      // Act
      authorizeAdmin(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateMaxLifts controller', () => {
    it('should update max lifts when called with proper authorization', async () => {
      // This test simulates the endpoint being called after middleware passes
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.user = { userId: adminUser.id, role: 'ADMIN' };
      req.body = {
        maxBench: 235,
        maxOHP: 145,
      };

      // Act
      await updateMaxLifts(req, res);

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: adminUser.id },
        data: expect.objectContaining({
          maxBench: 235,
          maxOHP: 145,
        }),
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});