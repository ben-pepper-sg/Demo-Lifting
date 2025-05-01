// Mock the types module
jest.mock('../types', () => ({
  AuthRequest: jest.fn(),
}));

// Add global test setup here