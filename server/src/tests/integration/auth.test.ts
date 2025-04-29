import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import authRoutes from '../../routes/auth.routes';
import { mockPrisma, createTestApp } from '../../utils/testUtils';

describe('Auth API Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp(authRoutes, 'auth');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      };

      // Mock that the user doesn't exist yet
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      // Mock user creation
      mockPrisma.user.create.mockResolvedValueOnce({
        id: '1',
        email: userData.email,
        name: userData.name,
        password: 'hashedPassword',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Password123',
      };

      // Mock that the user already exists
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: userData.email,
        name: userData.name,
        password: 'hashedPassword',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    it('should login a user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      // Mock finding the user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: loginData.email,
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(loginData.email);
    });

    it('should return 401 if credentials are invalid', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const hashedPassword = await bcrypt.hash('Password123', 10);

      // Mock finding the user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: loginData.email,
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 if user does not exist', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      // Mock that user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});