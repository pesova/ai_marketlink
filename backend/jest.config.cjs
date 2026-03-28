/** @type {import('jest').Config} */
const tsJestTransform = {
  '^.+\\.tsx?$': [
    'ts-jest',
    { tsconfig: 'tsconfig.jest.json' },
  ],
};

module.exports = {
  testTimeout: 120000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/validators.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.env.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.unit.ts'],
      transform: tsJestTransform,
    },
    {
      displayName: 'integration',
      testPathIgnorePatterns: ['<rootDir>/tests/validators.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.env.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.ts'],
      maxWorkers: 1,
      transform: tsJestTransform,
    },
  ],
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/seeders/**',
  ],
};
