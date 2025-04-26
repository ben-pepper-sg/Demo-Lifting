import dotenv from 'dotenv';
import { mockPrisma } from '../utils/testUtils';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Setup environment for tests
dotenv.config({ path: '.env.test' });

// Global setup
beforeAll(() => {
  // Any global setup can go here
  process.env.JWT_SECRET = 'test-secret';
});

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Any global cleanup can go here
});