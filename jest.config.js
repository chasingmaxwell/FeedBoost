module.exports = {
  coverageDirectory: '__coverage__',
  // Wait to enforce coverage.
  // coverageThreshold: {
  //   global: {
  //     branches: 100,
  //     functions: 100,
  //     lines: 100,
  //     statements: 100,
  //   },
  // },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/lib', '<rootDir>/config'],
  collectCoverageFrom: ['<rootDir>/src/**'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
