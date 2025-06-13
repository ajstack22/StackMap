// Simple script to check if we can connect to the test server
const http = require('http');

const PORT = process.env.PORT || 5501;

console.log(`Checking if server is running on port ${PORT}...`);

http.get(`http://localhost:${PORT}/tests/test-runner.html`, (res) => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`Status: ${res.statusCode}`);
    console.log('\nTo run tests manually:');
    console.log(`1. Open http://localhost:${PORT}/tests/test-runner.html`);
    console.log('2. Select "All Tests" from dropdown');
    console.log('3. Click "Run Tests"');
    console.log('4. Check the test output for results');
}).on('error', (err) => {
    console.error(`❌ Cannot connect to server on port ${PORT}:`, err.message);
    console.log('\nPlease ensure your development server is running.');
});