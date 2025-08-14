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
    
    // Validate token format - V2 tokens only
    if (!preg_match('/^[A-Za-z0-9_-]{24,}$/', $token)) {
        throw new Exception('Invalid token format - V2 tokens required');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Fetch share data including version
    $stmt = $db->prepare("
        SELECT 
            share_id,
            encrypted_data,
            recipient_name,
            share_note,
            expires_at,
            accessed_count,
            share_version
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
    
    // V2 only: Zero-knowledge encrypted share
    // Return encrypted data for client-side decryption
    echo json_encode([
        'success' => true,
        'version' => 2,
        'encrypted_data' => $share['encrypted_data'],
        'recipient_name' => $share['recipient_name'],
        'share_note' => $share['share_note'],
        'expires_at' => $share['expires_at'],
        'access_count' => intval($share['accessed_count']) + 1
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