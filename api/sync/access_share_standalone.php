<?php
/**
 * Standalone test version of access_share.php
 * This version returns mock data to test the share viewing functionality
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Get token from query parameter
    $token = $_GET['token'] ?? '';
    
    // Validate token format - support both v1 and v2 tokens
    if (!preg_match('/^[A-Z0-9]{6,8}$/', $token) && !preg_match('/^[A-Za-z0-9_-]{24,}$/', $token)) {
        throw new Exception('Invalid token format');
    }
    
    // Determine if this is a v2 token (longer format)
    $isV2 = strlen($token) >= 24;
    
    if ($isV2) {
        // For v2, we need to create properly encrypted test data
        // Since we can't decrypt without the actual key, let's return a message
        echo json_encode([
            'success' => true,
            'version' => 2,
            'test_mode' => true,
            'message' => 'Share endpoint is working! The real share would be encrypted.',
            'token_info' => [
                'token' => $token,
                'length' => strlen($token),
                'type' => 'v2 encrypted share'
            ],
            'recipient_name' => 'Test Recipient',
            'share_note' => 'This is a test share',
            'expires_at' => date('Y-m-d H:i:s', time() + 86400),
            'access_count' => 1
        ]);
    } else {
        // Return mock data for v1 share
        echo json_encode([
            'success' => true,
            'version' => 1,
            'data' => [
                'share_id' => 'test-share-id',
                'user' => [
                    'id' => 'test-user-id',
                    'name' => 'Test User',
                    'icon' => 'Pizza',
                    'days' => [
                        'today' => [
                            'activities' => []
                        ]
                    ]
                ],
                'recipient_name' => 'Test Recipient',
                'share_note' => 'This is a test share',
                'shared_at' => date('Y-m-d H:i:s'),
                'expires_at' => date('Y-m-d H:i:s', time() + 86400),
                'expires_in' => '24 hours',
                'accessed_count' => 1,
                'read_only' => true
            ]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>