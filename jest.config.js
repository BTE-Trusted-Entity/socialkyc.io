export default {
  coverageProvider: 'v8',
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/testing/identity-obj-proxy.js',
  },
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  // A map from regular expressions to paths to transformers
  transform: {
    '\\.tsx?$': 'ts-jest',
    'node_modules/@polkadot/.*': 'babel-jest',
    'node_modules/@babel/runtime/.*': 'babel-jest',
  },
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['/node_modules/(?!(@polkadot)|(@babel/runtime))'],
};
