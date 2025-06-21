// Shared configuration for all story tests
module.exports = {
    // Test server configuration
    TEST_PORT: process.env.TEST_PORT || 5502,
    TEST_HOST: 'localhost',
    
    // Helper to get test URL
    getTestUrl: (path = '') => {
        const port = process.env.TEST_PORT || 5502;
        return `http://localhost:${port}${path}`;
    },
    
    // Common timeouts
    TIMEOUTS: {
        pageLoad: 10000,
        elementWait: 5000,
        animationWait: 1000
    }
};