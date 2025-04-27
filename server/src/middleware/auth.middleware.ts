import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      adminActionTracked?: boolean;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log authentication attempt without token
      Sentry.captureMessage('Authorization attempt without token', {
        level: 'warning',
        tags: {
          type: 'authentication',
          endpoint: req.originalUrl
        },
        extra: {
          ip: req.ip,
          method: req.method,
          headers: req.headers
        }
      });
      
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    
    next();
  } catch (error) {
    // Log detailed authentication error to Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'authentication',
        endpoint: req.originalUrl
      },
      extra: {
        ip: req.ip,
        method: req.method,
        path: req.path
      }
    });
    
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    // Log unauthorized admin access attempt
    Sentry.captureMessage('Unauthorized admin access attempt', {
      level: 'warning',
      tags: {
        type: 'authorization',
        endpoint: req.originalUrl,
        requiredRole: 'ADMIN'
      },
      extra: {
        userId: req.user?.userId,
        userRole: req.user?.role || 'undefined',
        ip: req.ip,
        method: req.method,
        path: req.path
      }
    });
    
    return res.status(403).json({ error: 'Access denied. Admin privileges required' });
  }
  
  // Track admin actions
  const adminContext = {
    userId: req.user.userId,
    role: req.user.role,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query
  };
  
  // Add admin tracking data to the request
  req.adminActionTracked = true;
  
  // Create admin transaction metadata
  const transactionId = `admin-${req.method}-${req.path}-${Date.now()}`;
  
  // Add response tracking
  res.on('finish', () => {
    // Log successful admin actions
    Sentry.addBreadcrumb({
      category: 'admin.access',
      message: `Admin action completed: ${req.method} ${req.path}`,
      level: 'info',
      data: {
        ...adminContext,
        statusCode: res.statusCode,
        transactionId
      }
    });
    
    if (res.statusCode >= 400) {
      Sentry.captureMessage(`Admin action error: ${req.method} ${req.path}`, {
        level: 'error',
        tags: {
          type: 'admin.action.error',
          statusCode: res.statusCode.toString(),
          adminId: req.user.userId
        },
        extra: adminContext
      });
    }
  });
  
  next();
};

export const authorizeCoach = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'COACH')) {
    // Log unauthorized coach access attempt
    Sentry.captureMessage('Unauthorized coach access attempt', {
      level: 'warning',
      tags: {
        type: 'authorization',
        endpoint: req.originalUrl,
        requiredRole: 'COACH/ADMIN'
      },
      extra: {
        userId: req.user?.userId,
        userRole: req.user?.role || 'undefined',
        ip: req.ip,
        method: req.method,
        path: req.path
      }
    });
    
    return res.status(403).json({ error: 'Access denied. Coach privileges required' });
  }
  
  next();
};