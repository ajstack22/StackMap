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
    // Support both old (?token=) and new (?id=) parameters
    $token = $_GET['token'] ?? null;
    $shareId = $_GET['id'] ?? null;
    
    // Determine which format we're using
    if ($shareId) {
        // V3: Access by share ID only (no token)
        // Accept both XXXX-XXXX invite format and legacy 16-char hex
        if (!preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i', $shareId) && 
            !preg_match('/^[a-f0-9]{16}$/i', $shareId)) {
            throw new Exception('Invalid share ID format');
        }
    } elseif ($token) {
        // V2: Legacy token-based access
        if (!preg_match('/^[A-Za-z0-9_-]{24,}$/', $token)) {
            throw new Exception('Invalid token format');
        }
    } else {
        throw new Exception('Missing required parameter: token or id');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Fetch share data based on format
    if ($shareId) {
        // V3: Query by share_id
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
            WHERE share_id = ?
            AND expires_at > NOW()
        ");
        $stmt->execute([$shareId]);
    } else {
        // V2: Query by token
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
    }
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
    if ($shareId) {
        $updateStmt = $db->prepare("
            UPDATE share_links 
            SET accessed_count = accessed_count + 1,
                last_accessed_at = NOW()
            WHERE share_id = ?
        ");
        $updateStmt->execute([$shareId]);
    } else {
        $updateStmt = $db->prepare("
            UPDATE share_links 
            SET accessed_count = accessed_count + 1,
                last_accessed_at = NOW()
            WHERE access_token = ?
        ");
        $updateStmt->execute([$token]);
    }
    
    // Return encrypted data for client-side decryption
    // Version indicates encryption format
    echo json_encode([
        'success' => true,
        'version' => intval($share['share_version']) ?: 2,
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