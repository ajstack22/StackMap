<?php
/**
 * Create Sync Invite Endpoint
 * Generates a short invite code for joining sync without exposing recovery phrase
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

/**
 * Generate a readable invite code in format XXXX-XXXX
 * Uses characters that are unambiguous (no 0/O, 1/I/L)
 */
function generateInviteCode() {
    // Character set without ambiguous characters
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    
    for ($i = 0; $i < 8; $i++) {
        if ($i == 4) {
            $code .= '-';
        }
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    
    return $code;
}

try {
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid request data');
    }
    
    // Required fields
    if (!isset($data['sync_id'])) {
        throw new Exception('Missing sync_id');
    }
    
    $syncId = $data['sync_id'];
    $deviceId = $data['device_id'] ?? null;
    $deviceName = $data['device_name'] ?? 'Unknown Device';
    $expiresHours = intval($data['expires_hours'] ?? 24);
    $maxUses = intval($data['max_uses'] ?? 1);
    $note = $data['note'] ?? null;
    
    // Validate sync_id format (32 hex characters)
    if (!preg_match('/^[a-f0-9]{32}$/i', $syncId)) {
        throw new Exception('Invalid sync_id format');
    }
    
    // Validate expiration (1 hour to 7 days)
    if ($expiresHours < 1 || $expiresHours > 168) {
        throw new Exception('Expiration must be between 1 hour and 7 days');
    }
    
    // Validate max uses (1-10)
    if ($maxUses < 1 || $maxUses > 10) {
        throw new Exception('Max uses must be between 1 and 10');
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if sync exists (optional - could skip for privacy)
    $checkStmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM sync_records 
        WHERE sync_id = ?
        LIMIT 1
    ");
    $checkStmt->execute([$syncId]);
    $result = $checkStmt->fetch();
    
    if ($result['count'] == 0) {
        throw new Exception('Sync group not found');
    }
    
    // Generate unique invite code (retry if collision)
    $inviteCode = null;
    $attempts = 0;
    while ($attempts < 10) {
        $inviteCode = generateInviteCode();
        
        // Check if code already exists
        $checkCode = $db->prepare("SELECT id FROM sync_invites WHERE invite_code = ?");
        $checkCode->execute([$inviteCode]);
        
        if (!$checkCode->fetch()) {
            break; // Code is unique
        }
        
        $attempts++;
    }
    
    if ($attempts >= 10) {
        throw new Exception('Failed to generate unique invite code');
    }
    
    // Calculate expiration
    $expiresAt = date('Y-m-d H:i:s', time() + ($expiresHours * 3600));
    
    // Store invite
    $stmt = $db->prepare("
        INSERT INTO sync_invites (
            invite_code, 
            sync_id, 
            expires_at,
            created_by_device,
            max_uses,
            note
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $inviteCode,
        $syncId,
        $expiresAt,
        $deviceId ?? $deviceName,
        $maxUses,
        $note
    ]);
    
    // Generate URLs for different environments
    $isQual = strpos($_SERVER['REQUEST_URI'] ?? '', '/qual/') !== false;
    $baseUrl = $isQual ? 'https://stackmap.app/qual' : 'https://stackmap.app';
    
    // Return invite information
    // Note: Recovery phrase should be appended client-side as fragment
    echo json_encode([
        'success' => true,
        'invite_code' => $inviteCode,
        'invite_url' => $baseUrl . '/sync/' . $inviteCode,
        'expires_at' => $expiresAt,
        'expires_in_hours' => $expiresHours,
        'max_uses' => $maxUses,
        'note' => $note
    ]);
    
} catch (Exception $e) {
    error_log('Create invite error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>