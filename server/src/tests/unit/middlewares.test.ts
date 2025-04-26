import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

// Mock express request, response, and next function
const mockRequest = (headers = {}) => {
  return {
    headers,
  } as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should call next() when token is valid', () => {
      const userId = '123';
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userId);
    });

    it('should return 401 when no token is provided', () => {
      const req = mockRequest();
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 401 when token is invalid', () => {
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('adminMiddleware', () => {
    it('should call next() when user is admin', () => {
      const req = mockRequest();
      req.user = { id: '123', role: 'admin' };
      const res = mockResponse();

      adminMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      const req = mockRequest();
      req.user = { id: '123', role: 'user' };
      const res = mockResponse();

      adminMiddleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });
});