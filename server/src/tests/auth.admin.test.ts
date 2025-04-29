import { login } from '../controllers/auth.controller';
import { mockPrisma } from '../utils/testUtils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the required modules
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Request and Response
const mockRequest = () => {
  const req: any = {};
  req.body = {};
  req.user = {};
  return req;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin Authentication', () => {
  // Test user data
  const adminUser = {
    id: '1',
    email: 'admin@test.com',
    password: 'Password123!',
    passwordHash: 'hashedPassword',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularUser = {
    id: '2',
    email: 'user@test.com',
    password: 'Password123!',
    passwordHash: 'hashedPassword',
    firstName: 'Regular',
    lastName: 'User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Mock JWT sign function
    (jwt.sign as jest.Mock).mockReturnValue('mocked-token');
    
    // Mock bcrypt.compare to return true for our test
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    
    // Mock findUnique to return user based on email
    mockPrisma.user.findUnique.mockImplementation((args) => {
      const email = args.where.email;
      if (email === adminUser.email) {
        return Promise.resolve(adminUser);
      } else if (email === regularUser.email) {
        return Promise.resolve(regularUser);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Login', () => {
    it('should login successfully with admin credentials', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = {
        email: adminUser.email,
        password: adminUser.password,
      };

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({ role: 'ADMIN' }),
          token: 'mocked-token',
        })
      );
    });

    it('should login successfully with regular user credentials', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = {
        email: regularUser.email,
        password: regularUser.password,
      };

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({ role: 'USER' }),
          token: 'mocked-token',
        })
      );
    });

    it('should include user role in JWT token payload', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = {
        email: adminUser.email,
        password: adminUser.password,
      };

      // Act
      await login(req, res);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: adminUser.id,
          role: adminUser.role,
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});