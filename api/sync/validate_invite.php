<?php
/**
 * Validate Sync Invite Endpoint
 * Checks if an invite code is valid and returns sync information
 * Never exposes the recovery phrase - that stays client-side
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'database.php';

try {
    // Get invite code from query parameter or POST body
    $inviteCode = null;
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $inviteCode = $_GET['code'] ?? '';
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $inviteCode = $data['invite_code'] ?? '';
    } else {
        http_response_code(405);
        throw new Exception('Method not allowed');
    }
    
    // Normalize invite code (uppercase, no spaces)
    $inviteCode = strtoupper(trim($inviteCode));
    
    // Validate format (XXXX-XXXX)
    if (!preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/', $inviteCode)) {
        throw new Exception('Invalid invite code format');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if invite exists and is valid
    $stmt = $db->prepare("
        SELECT 
            sync_id,
            expires_at,
            use_count,
            max_uses,
            note
        FROM sync_invites
        WHERE invite_code = ?
        AND expires_at > NOW()
        AND use_count < max_uses
    ");
    
    $stmt->execute([$inviteCode]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invite) {
        // Check if invite exists but is expired or used up
        $checkStmt = $db->prepare("
            SELECT expires_at, use_count, max_uses
            FROM sync_invites
            WHERE invite_code = ?
        ");
        $checkStmt->execute([$inviteCode]);
        $check = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($check) {
            if ($check['expires_at'] < date('Y-m-d H:i:s')) {
                throw new Exception('Invite code has expired');
            }
            if ($check['use_count'] >= $check['max_uses']) {
                throw new Exception('Invite code has been used');
            }
        }
        
        throw new Exception('Invalid invite code');
    }
    
    // Get the latest encrypted data for this sync
    $dataStmt = $db->prepare("
        SELECT 
            encrypted_blob,
            client_timestamp as timestamp,
            device_id as device_name
        FROM sync_records
        WHERE sync_id = ?
        ORDER BY client_timestamp DESC
        LIMIT 1
    ");
    
    $dataStmt->execute([$invite['sync_id']]);
    $syncData = $dataStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$syncData) {
        throw new Exception('Sync group not found');
    }
    
    // Mark invite as being validated (not used yet - that happens on successful join)
    // This helps track interest even if join fails
    
    // Return sync information
    // Client will need to provide recovery phrase to decrypt
    echo json_encode([
        'success' => true,
        'sync_id' => $invite['sync_id'],
        'encrypted_data' => $syncData['encrypted_blob'],
        'last_updated' => $syncData['timestamp'],
        'last_device' => $syncData['device_name'],
        'invite_note' => $invite['note'],
        'expires_at' => $invite['expires_at']
    ]);
    
} catch (Exception $e) {
    error_log('Validate invite error: ' . $e->getMessage());
    
    // Return different status codes for different errors
    if (strpos($e->getMessage(), 'expired') !== false) {
        http_response_code(410); // Gone
    } else if (strpos($e->getMessage(), 'Invalid invite') !== false) {
        http_response_code(404); // Not Found
    } else {
        http_response_code(400); // Bad Request
    }
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>