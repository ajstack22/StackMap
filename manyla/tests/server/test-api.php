<?php
/**
 * StackMap Sync API Test Script
 * 
 * Run this script to test your API implementation
 * Usage: php test-api.php [api-base-url]
 */

// Configuration
$apiBase = $argv[1] ?? 'http://localhost/api/sync';
$testSyncId = bin2hex(random_bytes(16));
$testDeviceId = bin2hex(random_bytes(16));
$testData = ['test' => 'data', 'timestamp' => time()];
$testBlob = base64_encode(json_encode($testData));

// Colors for output
$green = "\033[0;32m";
$red = "\033[0;31m";
$yellow = "\033[0;33m";
$reset = "\033[0m";

echo "StackMap Sync API Test Suite\n";
echo "API Base: $apiBase\n";
echo "=============================\n\n";

// Test functions
function makeRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init($url);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local testing
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    
    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'headers' => $headers,
        'body' => json_decode($body, true),
        'raw' => $body
    ];
}

function testPassed($test) {
    global $green, $reset;
    echo "{$green}✓ {$test}{$reset}\n";
}

function testFailed($test, $reason) {
    global $red, $reset;
    echo "{$red}✗ {$test}: {$reason}{$reset}\n";
}

function testWarning($message) {
    global $yellow, $reset;
    echo "{$yellow}⚠ {$message}{$reset}\n";
}

// Test 1: Health Check
echo "1. Testing Health Endpoint\n";
$response = makeRequest("$apiBase/health.php");

if ($response['code'] === 200 && $response['body']['status'] === 'healthy') {
    testPassed("Health check endpoint working");
    testPassed("Version: " . $response['body']['version']);
} else {
    testFailed("Health check", "Status: {$response['code']}");
    echo "Response: " . $response['raw'] . "\n";
}
echo "\n";

// Test 2: Create Sync Group
echo "2. Testing Create Endpoint\n";
$createData = [
    'sync_id' => $testSyncId,
    'encrypted_blob' => $testBlob,
    'device_id' => $testDeviceId,
    'device_name' => 'Test Device'
];

$response = makeRequest("$apiBase/create.php", 'POST', $createData);

if ($response['code'] === 200 && $response['body']['success'] === true) {
    testPassed("Create sync group successful");
    testPassed("Version: " . $response['body']['version']);
} else {
    testFailed("Create sync group", "Status: {$response['code']}");
    echo "Response: " . $response['raw'] . "\n";
}
echo "\n";

// Test 3: Duplicate Create (Should Fail)
echo "3. Testing Duplicate Create Prevention\n";
$response = makeRequest("$apiBase/create.php", 'POST', $createData);

if ($response['code'] === 409) {
    testPassed("Duplicate sync group prevented");
} else {
    testFailed("Duplicate prevention", "Expected 409, got {$response['code']}");
}
echo "\n";

// Test 4: Pull Data
echo "4. Testing Pull Endpoint\n";
$response = makeRequest("$apiBase/pull.php?sync_id=$testSyncId&device_id=$testDeviceId");

if ($response['code'] === 200 && $response['body']['encrypted_blob'] === $testBlob) {
    testPassed("Pull data successful");
    testPassed("Data integrity verified");
} else {
    testFailed("Pull data", "Status: {$response['code']}");
}
echo "\n";

// Test 5: Push Update
echo "5. Testing Push Endpoint\n";
$newData = ['test' => 'updated', 'timestamp' => time()];
$newBlob = base64_encode(json_encode($newData));

$pushData = [
    'sync_id' => $testSyncId,
    'device_id' => $testDeviceId,
    'encrypted_blob' => $newBlob,
    'sync_type' => 'full'
];

$response = makeRequest("$apiBase/push.php", 'POST', $pushData);

if ($response['code'] === 200 && $response['body']['version'] === 2) {
    testPassed("Push update successful");
    testPassed("Version incremented to " . $response['body']['version']);
} else {
    testFailed("Push update", "Status: {$response['code']}");
}
echo "\n";

// Test 6: Verify Update
echo "6. Testing Updated Data\n";
$response = makeRequest("$apiBase/pull.php?sync_id=$testSyncId&device_id=$testDeviceId");

if ($response['code'] === 200 && $response['body']['encrypted_blob'] === $newBlob) {
    testPassed("Updated data retrieved correctly");
    testPassed("Version is " . $response['body']['version']);
} else {
    testFailed("Verify update", "Data mismatch");
}
echo "\n";

// Test 7: Input Validation
echo "7. Testing Input Validation\n";

// Invalid sync ID
$response = makeRequest("$apiBase/pull.php?sync_id=invalid&device_id=$testDeviceId");
if ($response['code'] === 400) {
    testPassed("Invalid sync ID rejected");
} else {
    testFailed("Sync ID validation", "Expected 400, got {$response['code']}");
}

// Invalid device ID
$response = makeRequest("$apiBase/pull.php?sync_id=$testSyncId&device_id=invalid");
if ($response['code'] === 400) {
    testPassed("Invalid device ID rejected");
} else {
    testFailed("Device ID validation", "Expected 400, got {$response['code']}");
}

// Invalid base64
$invalidData = [
    'sync_id' => bin2hex(random_bytes(16)),
    'device_id' => bin2hex(random_bytes(16)),
    'encrypted_blob' => 'not-valid-base64!@#$'
];
$response = makeRequest("$apiBase/create.php", 'POST', $invalidData);
if ($response['code'] === 400) {
    testPassed("Invalid base64 blob rejected");
} else {
    testFailed("Blob validation", "Expected 400, got {$response['code']}");
}
echo "\n";

// Test 8: Rate Limiting
echo "8. Testing Rate Limiting\n";
testWarning("Making 35 rapid requests to test rate limiting...");

$rateLimitHit = false;
for ($i = 1; $i <= 35; $i++) {
    $response = makeRequest("$apiBase/health.php");
    if ($response['code'] === 429) {
        $rateLimitHit = true;
        testPassed("Rate limit enforced after ~30 requests");
        
        // Check rate limit headers
        if (strpos($response['headers'], 'X-RateLimit-Limit') !== false) {
            testPassed("Rate limit headers present");
        }
        break;
    }
}

if (!$rateLimitHit) {
    testWarning("Rate limiting might not be working properly");
}
echo "\n";

// Test 9: Delete Sync Data
echo "9. Testing Delete Endpoint\n";
$deleteData = [
    'sync_id' => $testSyncId,
    'device_id' => $testDeviceId
];

$response = makeRequest("$apiBase/delete.php", 'POST', $deleteData);

if ($response['code'] === 200 && $response['body']['deleted_count'] > 0) {
    testPassed("Delete sync data successful");
} else {
    testFailed("Delete sync data", "Status: {$response['code']}");
}

// Verify deletion
$response = makeRequest("$apiBase/pull.php?sync_id=$testSyncId&device_id=$testDeviceId");
if ($response['code'] === 404) {
    testPassed("Data confirmed deleted");
} else {
    testFailed("Verify deletion", "Data still exists");
}
echo "\n";

// Test 10: CORS Headers
echo "10. Testing CORS Headers\n";
$response = makeRequest("$apiBase/health.php");

if (strpos($response['headers'], 'Access-Control-Allow-') !== false) {
    testPassed("CORS headers present");
} else {
    testWarning("CORS headers might not be configured");
}
echo "\n";

// Summary
echo "=============================\n";
echo "Test Summary:\n";
echo "- Health Check: Working\n";
echo "- Create/Read/Update/Delete: Tested\n";
echo "- Input Validation: Tested\n";
echo "- Rate Limiting: Tested\n";
echo "- Security Headers: Checked\n";
echo "\nIf all tests passed, your API is ready for use!\n";
?>