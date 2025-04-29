import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import { testPrisma as prisma } from './helpers/integrationTestPrisma';

// Create a test user to perform password reset operations
let testUser = {
  id: '',
  email: 'passwordreset@test.com',
  password: 'testpassword123',
  resetToken: ''
};

// Mock the email service that would normally send emails
jest.mock('../services/email', () => ({
  sendPasswordResetEmail: jest.fn(() => Promise.resolve())
}));

// Using a separate prisma client for integration tests

// Set up express app
const app = express();
app.use(express.json());

// Import routes and controllers directly
import { login, register, requestPasswordReset, resetPassword } from '../controllers/auth.controller';

// Set up auth routes manually
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);
app.post('/api/auth/forgot-password', requestPasswordReset);
app.post('/api/auth/reset-password', resetPassword);

describe('Password Reset Integration Tests', () => {
  // Set up test user before all tests
  beforeAll(async () => {
    // Clear any existing test user
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: testUser.email }
      });
      
      if (existingUser) {
        await prisma.user.delete({
          where: { id: existingUser.id }
        });
      }
    } catch (error) {
      console.log('User cleanup error:', error);
      // Continue with test setup even if cleanup fails
    }

    // Create a new test user
    try {
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      const createdUser = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: 'Test',
          lastName: 'User',
          role: 'USER'
        }
      });

      testUser.id = createdUser.id;
      console.log('Test user created with ID:', testUser.id);
    } catch (error) {
      console.log('Error creating test user:', error);
      // Create a fallback ID to allow tests to continue
      testUser.id = 'test-user-id-' + Date.now().toString();
      console.log('Using fallback ID:', testUser.id);
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });
      
      if (user) {
        await prisma.user.delete({
          where: { id: user.id }
        });
      }
    } catch (error) {
      console.log('User cleanup error:', error);
    } finally {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.log('Error disconnecting from database:', error);
      }
    }
  });

  it('should request a password reset token', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    // Verify response has correct shape
    expect(response.body.message).toContain('password reset link has been sent');
    // In our development environment, we return the token for testing
    expect(response.body.resetToken).toBeDefined();

    // Save the token for the next test
    testUser.resetToken = response.body.resetToken;

    // Verify the token was saved to the database
    const user = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    expect(user?.resetToken).toBe(testUser.resetToken);
    expect(user?.resetTokenExpiry).toBeInstanceOf(Date);
    expect(user?.resetTokenExpiry?.getTime()).toBeGreaterThan(Date.now());
  });

  it('should reset the password with a valid token', async () => {
    // Ensure we have a token from the previous test
    expect(testUser.resetToken).toBeTruthy();

    const newPassword = 'newSecurePassword123';

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: testUser.resetToken,
        password: newPassword
      })
      .expect(200);

    expect(response.body.message).toContain('Password has been reset successfully');

    // Verify the token was cleared
    const user = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    expect(user?.resetToken).toBeNull();
    expect(user?.resetTokenExpiry).toBeNull();

    // Verify we can login with the new password
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: newPassword
      })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
  });

  it('should reject reset with invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid-token-that-does-not-exist',
        password: 'anyPassword123'
      })
      .expect(400);

    expect(response.body.error).toContain('Invalid or expired reset token');
  });

  it('should prevent email enumeration in forgot password', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    // Should return the same success message even for non-existent emails
    expect(response.body.message).toContain('password reset link has been sent');
    // But no token should be returned
    expect(response.body.resetToken).toBeUndefined();
  });
});