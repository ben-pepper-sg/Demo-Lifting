module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};