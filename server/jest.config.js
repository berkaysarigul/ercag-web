module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    testTimeout: 30000,
    setupFilesAfterEnv: ['./tests/setup.js']
};
