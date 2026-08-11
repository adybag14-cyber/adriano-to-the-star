module.exports = {
    testEnvironment: 'jsdom',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'exoplanet-pioneer.js',
        'planet-3d-viewer.js',
        'stellar-ai-core.js',
        '!node_modules/**',
        '!dist/**',
        '!*.config.js'
    ],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
