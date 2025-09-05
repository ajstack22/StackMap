<?php
/**
 * Use Sync Invite Endpoint
 * Marks an invite as used after successful sync join
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
    
    // Required fields
    if (!isset($data['invite_code'])) {
        throw new Exception('Missing invite_code');
    }
    
    $inviteCode = strtoupper(trim($data['invite_code']));
    $deviceId = $data['device_id'] ?? null;
    $deviceName = $data['device_name'] ?? 'Unknown Device';
    
    // Validate format
    if (!preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/', $inviteCode)) {
        throw new Exception('Invalid invite code format');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Check if invite is still valid
        $checkStmt = $db->prepare("
            SELECT 
                id,
                sync_id,
                use_count,
                max_uses,
                expires_at
            FROM sync_invites
            WHERE invite_code = ?
            FOR UPDATE
        ");
        
        $checkStmt->execute([$inviteCode]);
        $invite = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invite) {
            throw new Exception('Invite code not found');
        }
        
        // Use UTC consistently for time comparisons
        if ($invite['expires_at'] < gmdate('Y-m-d H:i:s')) {
            throw new Exception('Invite code has expired');
        }
        
        if ($invite['use_count'] >= $invite['max_uses']) {
            throw new Exception('Invite code has already been used');
        }
        
        // Update invite usage
        $updateStmt = $db->prepare("
            UPDATE sync_invites
            SET 
                use_count = use_count + 1,
                used_at = CASE 
                    WHEN used_at IS NULL THEN ? 
                    ELSE used_at 
                END,
                used_by_device = CASE
                    WHEN used_by_device IS NULL THEN ?
                    ELSE CONCAT(used_by_device, ', ', ?)
                END
            WHERE id = ?
        ");
        
        $updateStmt->execute([
            gmdate('Y-m-d H:i:s'),
            $deviceId ?? $deviceName,
            $deviceId ?? $deviceName,
            $invite['id']
        ]);
        
        // Commit transaction
        $db->commit();
        
        // Return success
        echo json_encode([
            'success' => true,
            'sync_id' => $invite['sync_id'],
            'uses_remaining' => $invite['max_uses'] - ($invite['use_count'] + 1)
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log('Use invite error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>