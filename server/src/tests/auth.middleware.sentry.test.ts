// Mock modules before imports
const mockSentry = {
  captureMessage: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn()
};

jest.mock('@sentry/node', () => mockSentry);
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

// Import modules after mocks
import { authenticate, authorizeAdmin, authorizeCoach } from '../middleware/auth.middleware';
import * as Sentry from '@sentry/node';
import jwt from 'jsonwebtoken';

describe('Auth Middleware with Sentry Integration', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
      originalUrl: '/api/admin/test',
      ip: '127.0.0.1',
      method: 'GET',
      path: '/admin/test',
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return res;
      }),
      statusCode: 200
    };
    next = jest.fn();

    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should capture message to Sentry when no token provided', () => {
      authenticate(req, res, next);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Authorization attempt without token',
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            type: 'authentication',
            endpoint: '/api/admin/test'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should capture exception to Sentry when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(req, res, next);

      expect(mockSentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed to next middleware when token is valid', () => {
      req.headers.authorization = 'Bearer valid-token';
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: '123',
        role: 'ADMIN'
      });

      authenticate(req, res, next);

      expect(req.user).toEqual({
        userId: '123',
        role: 'ADMIN'
      });
      expect(next).toHaveBeenCalled();
      expect(mockSentry.captureException).not.toHaveBeenCalled();
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe('authorizeAdmin', () => {
    it('should capture message to Sentry when user is not an admin', () => {
      req.user = { userId: '123', role: 'USER' };

      authorizeAdmin(req, res, next);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Unauthorized admin access attempt',
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            type: 'authorization',
            requiredRole: 'ADMIN'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should set up admin action tracking when user is an admin', () => {
      req.user = { userId: '123', role: 'ADMIN' };

      authorizeAdmin(req, res, next);

      // Should mark the request as tracked
      expect(req.adminActionTracked).toBe(true);
      
      // Should have set up the response finish handler
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      
      // Call the finish handler to simulate response completion
      const finishHandler = (res.on as jest.Mock).mock.calls[0][1];
      res.statusCode = 200;
      finishHandler();
      
      // Should add a breadcrumb for successful action
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
        category: 'admin.access',
        level: 'info'
      }));
      
      expect(next).toHaveBeenCalled();
    });
    
    it('should capture errors when admin action fails', () => {
      req.user = { userId: '123', role: 'ADMIN' };

      authorizeAdmin(req, res, next);
      
      // Simulate a failed response
      const finishHandler = (res.on as jest.Mock).mock.calls[0][1];
      res.statusCode = 500;
      finishHandler();
      
      // Should capture the error message
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Admin action error: GET /admin/test',
        expect.objectContaining({
          level: 'error',
          tags: expect.objectContaining({
            statusCode: '500'
          })
        })
      );
    });
  });

  describe('authorizeCoach', () => {
    it('should capture message to Sentry when user has neither coach nor admin role', () => {
      req.user = { userId: '123', role: 'USER' };

      authorizeCoach(req, res, next);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Unauthorized coach access attempt',
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            type: 'authorization',
            requiredRole: 'COACH/ADMIN'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed when user is a coach', () => {
      req.user = { userId: '123', role: 'COACH' };

      authorizeCoach(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should proceed when user is an admin', () => {
      req.user = { userId: '123', role: 'ADMIN' };

      authorizeCoach(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});