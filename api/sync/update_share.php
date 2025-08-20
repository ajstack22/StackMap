<?php
/**
 * Update Share Link Endpoint
 * Updates an existing share with fresh encrypted data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

require_once 'config.php';
require_once 'database.php';

try {
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid request data');
    }
    
    // Validate required fields
    $required = ['access_token', 'encrypted_data'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    $token = $data['access_token'];
    $encryptedData = $data['encrypted_data'];
    
    // Validate encrypted data format
    if (!preg_match('/^[A-Za-z0-9+\/]+=*$/', $encryptedData)) {
        throw new Exception('Invalid encrypted data format');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if share exists and is not expired
    $checkStmt = $db->prepare("
        SELECT share_id, expires_at, share_version, auto_update
        FROM share_links 
        WHERE access_token = ? 
        AND expires_at > NOW()
    ");
    $checkStmt->execute([$token]);
    $share = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$share) {
        throw new Exception('Share not found or expired');
    }
    
    // Check if auto-update is enabled
    if (!$share['auto_update']) {
        throw new Exception('Share does not have auto-update enabled');
    }
    
    // Update the encrypted data
    $updateStmt = $db->prepare("
        UPDATE share_links 
        SET encrypted_data = ?,
            last_updated_at = NOW()
        WHERE access_token = ?
    ");
    
    $updateStmt->execute([
        $encryptedData,
        $token
    ]);
    
    // Log the update
    error_log("Share updated: {$share['share_id']} at " . date('Y-m-d H:i:s'));
    
    // Return success
    echo json_encode([
        'success' => true,
        'share_id' => $share['share_id'],
        'updated_at' => date('c')
    ]);
    
} catch (Exception $e) {
    error_log('Update share error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>