// Shared configuration for all story tests
module.exports = {
    // Test server configuration
    TEST_PORT: 5502,
    TEST_HOST: 'localhost',
    
    // Helper to get test URL
    getTestUrl: (path = '') => {
        return `http://localhost:5502${path}`;
    },
    
    // Common timeouts
    TIMEOUTS: {
        pageLoad: 10000,
        elementWait: 5000,
        animationWait: 1000
    }
};