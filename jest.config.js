module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
  ],
  coverageThreshold: {
    'src/services/sync/**/*.{js,ts}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/services/syncService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/services/encryptionService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/utils/dataNormalizer.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/*.test.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|react-native-vector-icons|react-native-pager-view)/)',
  ],
  testTimeout: 30000,
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
