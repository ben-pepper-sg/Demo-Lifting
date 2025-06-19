import morgan from 'morgan';
import { app } from '../../app';

jest.mock('morgan', () => {
  return jest.fn(() => {
    return jest.fn((req, res, next) => next());
  });
});

describe('Logging Configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('should enable morgan logger in development environment', () => {
    process.env.NODE_ENV = 'development';
    require('../../app');
    expect(morgan).toHaveBeenCalledWith('dev');
  });

  it('should not enable morgan logger in test environment', () => {
    process.env.NODE_ENV = 'test';
    require('../../app');
    expect(morgan).not.toHaveBeenCalled();
  });

  it('should handle morgan middleware initialization', () => {
    process.env.NODE_ENV = 'development';
    const app = require('../../app').app;
    
    // Verify morgan middleware is added to app
    const morganMiddleware = app._router.stack.find(
      (layer: any) => layer.name === 'morgan'
    );
    expect(morganMiddleware).toBeDefined();
  });

  it('should handle errors in error handling middleware', () => {
    const mockError = new Error('Test error');
    const mockReq = {} as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const mockNext = jest.fn();

    // Get the error handling middleware
    const errorHandler = app._router.stack
      .find((layer: any) => layer.name === 'errorHandler')
      ?.handle;

    if (errorHandler) {
      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: expect.any(String)
      });
    }
  });

  describe('Error Logging', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log errors to console in error handling middleware', () => {
      const mockError = new Error('Test error');
      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;
      const mockNext = jest.fn();

      const errorHandler = app._router.stack
        .find((layer: any) => layer.name === 'errorHandler')
        ?.handle;

      if (errorHandler) {
        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(console.error).toHaveBeenCalledWith(mockError.stack);
      }
    });

    it('should include error message in development environment', () => {
      process.env.NODE_ENV = 'development';
      const mockError = new Error('Test error');
      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;
      const mockNext = jest.fn();

      const errorHandler = app._router.stack
        .find((layer: any) => layer.name === 'errorHandler')
        ?.handle;

      if (errorHandler) {
        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Internal Server Error',
          message: mockError.message
        });
      }
    });

    it('should not include error message in production environment', () => {
      process.env.NODE_ENV = 'production';
      const mockError = new Error('Test error');
      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;
      const mockNext = jest.fn();

      const errorHandler = app._router.stack
        .find((layer: any) => layer.name === 'errorHandler')
        ?.handle;

      if (errorHandler) {
        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Internal Server Error',
          message: undefined
        });
      }
    });
  });
});