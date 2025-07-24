<?php
/**
 * Access Share Link Endpoint
 * Retrieves shared user data using an access token
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

require_once 'config.php';
require_once 'database.php';

try {
    // Get token from query parameter
    $token = $_GET['token'] ?? '';
    
    // Validate token format
    if (!preg_match('/^[A-Z0-9]{6,8}$/', $token)) {
        throw new Exception('Invalid token format');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Fetch share data
    $stmt = $db->prepare("
        SELECT 
            share_id,
            encrypted_data,
            recipient_name,
            share_note,
            expires_at,
            accessed_count
        FROM share_links
        WHERE access_token = ?
        AND expires_at > NOW()
    ");
    
    $stmt->execute([$token]);
    $share = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$share) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid or expired share link'
        ]);
        exit();
    }
    
    // Update access count and timestamp
    $updateStmt = $db->prepare("
        UPDATE share_links 
        SET accessed_count = accessed_count + 1,
            last_accessed_at = NOW()
        WHERE access_token = ?
    ");
    $updateStmt->execute([$token]);
    
    // Decrypt the data
    $decryptedData = json_decode(base64_decode($share['encrypted_data']), true);
    
    if (!$decryptedData) {
        throw new Exception('Failed to decrypt share data');
    }
    
    // Calculate time until expiration
    $expiresAt = new DateTime($share['expires_at']);
    $now = new DateTime();
    $interval = $now->diff($expiresAt);
    
    $hoursRemaining = ($interval->days * 24) + $interval->h;
    $expiresIn = $hoursRemaining > 24 
        ? $interval->days . ' day' . ($interval->days > 1 ? 's' : '')
        : $hoursRemaining . ' hour' . ($hoursRemaining > 1 ? 's' : '');
    
    // Return share data
    echo json_encode([
        'success' => true,
        'data' => [
            'share_id' => $share['share_id'],
            'user' => $decryptedData['user'],
            'recipient_name' => $share['recipient_name'],
            'share_note' => $share['share_note'],
            'shared_at' => $decryptedData['shared_at'],
            'expires_at' => $share['expires_at'],
            'expires_in' => $expiresIn,
            'access_count' => intval($share['accessed_count']) + 1,
            'read_only' => true
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Access share error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>