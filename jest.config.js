module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  verbose: true
};