import { Request } from 'express';

// Extend Request type to include user property
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}