export default {
  coverageProvider: 'v8',
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/testing/identity-obj-proxy.js',
  },
  // Use this configuration option to add custom reporters to Jest
  reporters: ['default', 'github-actions'],
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/src/testing/jest.setup.ts'],
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  // A map from regular expressions to paths to transformers
  transform: {
    '\\.tsx?$': 'ts-jest/legacy',
    'node_modules/@polkadot/.*': 'babel-jest',
    'node_modules/@babel/runtime/.*': 'babel-jest',
  },
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['/node_modules/(?!(@polkadot)|(@babel/runtime))'],
};
