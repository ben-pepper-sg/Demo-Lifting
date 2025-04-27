import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
const jwtMock = jwt as jest.Mocked<typeof jwt>;
import * as Sentry from '@sentry/node';

// Mock Sentry
const mockSentry = {
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
};

jest.mock('@sentry/node', () => mockSentry);

jest.mock('jsonwebtoken');

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should deny access when no token is provided', async () => {
      const res = await request(app).get('/api/admin/users');
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authorization token required');
      expect(mockSentry.captureMessage).toHaveBeenCalled();
    });
    
    it('should deny access when user is not an admin', async () => {
      // Mock JWT verification to return a non-admin user
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        userId: '123',
        role: 'USER'
      }));
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer fake-token');
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Access denied. Admin privileges required');
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Unauthorized admin access attempt', 
        expect.objectContaining({
          level: 'warning'
        })
      );
    });
    
    it('should allow access when user is an admin', async () => {
      // Mock JWT verification to return an admin user
      (jwt.verify as jest.Mock).mockImplementation(() => ({
        userId: '456',
        role: 'ADMIN'
      }));
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer fake-token');
      
      expect(res.status).toBe(200);
      // Verify that Sentry breadcrumb was added
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin.access',
          message: expect.stringContaining('Admin action completed')
        })
      );
    });
  });
});