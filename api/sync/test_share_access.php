<?php
// Minimal test version of share access
header('Content-Type: application/json');

// Get token
$token = $_GET['token'] ?? '';

// Basic validation
if (empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

// Check token format
$isV1 = preg_match('/^[A-Z0-9]{6,8}$/', $token);
$isV2 = preg_match('/^[A-Za-z0-9_-]{24,}$/', $token);

if (!$isV1 && !$isV2) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid token format', 'token' => $token]);
    exit;
}

// Return success
echo json_encode([
    'success' => true,
    'message' => 'Token validation passed',
    'token' => $token,
    'token_type' => $isV2 ? 'v2' : 'v1',
    'token_length' => strlen($token)
]);
?>