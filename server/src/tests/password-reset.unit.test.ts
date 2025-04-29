import { Request, Response } from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/auth.controller';
import { prisma } from '../lib/prisma';

// Mock the Prisma client
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock crypto for deterministic testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('test-reset-token'),
  }),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('Password Reset Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    } as any;
    
    // Reset the date spy
    jest.spyOn(global, 'Date').mockReset();
  });

  describe('requestPasswordReset', () => {
    it('should generate and store a reset token for existing user', async () => {
      // Mock request
      mockRequest = {
        body: { email: 'test@example.com' },
      };

      // Mock user exists
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: 'test-reset-token',
        resetTokenExpiry: new Date(),
      });

      // Create a fixed date for testing
      const fixedDate = 1672531200000; // 2023-01-01
      // Mock implementation of Date.now
      const originalNow = Date.now;
      Date.now = jest.fn(() => fixedDate);
      // Provide a fixed Date constructor for the reset token expiry
      const mockExpiry = new Date(fixedDate + 3600000);
      jest.spyOn(global, 'Date').mockImplementation(() => mockExpiry);

      // Call function
      await requestPasswordReset(mockRequest as Request, mockResponse as Response);

      // Assert user was found
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      // Assert token was generated and stored
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          resetToken: 'test-reset-token',
          resetTokenExpiry: expect.any(Date),
        },
      });

      // Assert response
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('password reset link has been sent'),
        resetToken: 'test-reset-token',
      }));
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should return success message even if user does not exist', async () => {
      // Mock request
      mockRequest = {
        body: { email: 'nonexistent@example.com' },
      };

      // Mock user does not exist
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Call function
      await requestPasswordReset(mockRequest as Request, mockResponse as Response);

      // Assert user was looked up
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });

      // Assert no update was attempted
      expect(prisma.user.update).not.toHaveBeenCalled();

      // Assert the same success response was returned (to prevent email enumeration)
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: expect.stringContaining('password reset link has been sent'),
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Mock request
      mockRequest = {
        body: { token: 'valid-token', password: 'newpassword123' },
      };

      // Mock finding user with valid token
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
        resetToken: null,
        resetTokenExpiry: null,
      });

      // Call function
      await resetPassword(mockRequest as Request, mockResponse as Response);

      // Assert user was found by token
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetToken: 'valid-token',
          resetTokenExpiry: { gt: expect.any(Date) },
        },
      });

      // Assert password was updated and token cleared
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'hashed-password',
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      // Assert success response
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Password has been reset successfully',
      });
    });

    it('should reject with invalid token', async () => {
      // Mock request
      mockRequest = {
        body: { token: 'invalid-token', password: 'newpassword123' },
      };

      // Mock no user found with this token
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Call function
      await resetPassword(mockRequest as Request, mockResponse as Response);

      // Assert proper search was attempted
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetToken: 'invalid-token',
          resetTokenExpiry: { gt: expect.any(Date) },
        },
      });

      // Assert no password update was attempted
      expect(prisma.user.update).not.toHaveBeenCalled();

      // Assert error response
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid or expired reset token',
      });
    });
  });
});