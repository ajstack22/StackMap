<?php
/**
 * Create Share Link Endpoint
 * Creates a temporary share link for provider access
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
    $required = ['sync_id', 'user_id', 'user_data', 'access_token', 'expires_hours'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate token format (6-8 uppercase alphanumeric)
    $token = $data['access_token'];
    if (!preg_match('/^[A-Z0-9]{6,8}$/', $token)) {
        throw new Exception('Invalid token format. Must be 6-8 uppercase alphanumeric characters.');
    }
    
    // Validate expiration hours (1-2160, max 3 months)
    $expiresHours = intval($data['expires_hours']);
    if ($expiresHours < 1 || $expiresHours > 2160) {
        throw new Exception('Expiration must be between 1 hour and 3 months (2160 hours)');
    }
    
    // Calculate expiration timestamp
    $expiresAt = date('Y-m-d H:i:s', time() + ($expiresHours * 3600));
    
    // Filter user data based on share settings
    $userData = $data['user_data'];
    if (!($data['include_completed'] ?? true)) {
        // Remove completed activities
        if (isset($userData['days'])) {
            foreach ($userData['days'] as $day => &$dayData) {
                if (isset($dayData['activities'])) {
                    $dayData['activities'] = array_filter($dayData['activities'], function($activity) {
                        return !($activity['completed'] ?? false);
                    });
                    // Re-index array
                    $dayData['activities'] = array_values($dayData['activities']);
                }
            }
        }
    }
    
    if (!($data['include_tomorrow'] ?? true)) {
        // Remove tomorrow data
        unset($userData['days']['tomorrow']);
    }
    
    // Add share metadata
    $shareData = [
        'user' => $userData,
        'shared_at' => date('c'),
        'expires_at' => $expiresAt,
        'recipient_name' => $data['recipient_name'] ?? null,
        'share_note' => $data['share_note'] ?? null,
        'read_only' => true
    ];
    
    // Encrypt the data (base64 for simplicity, could use proper encryption)
    $encryptedData = base64_encode(json_encode($shareData));
    
    // Generate unique share ID
    $shareId = bin2hex(random_bytes(16));
    
    // Store in database
    $db = Database::getInstance()->getConnection();
    
    // Check if token already exists
    $checkStmt = $db->prepare("SELECT id FROM share_links WHERE access_token = ?");
    $checkStmt->execute([$token]);
    if ($checkStmt->fetch()) {
        throw new Exception('Token already exists. Please generate a new one.');
    }
    
    $stmt = $db->prepare("
        INSERT INTO share_links (
            share_id, access_token, sync_id, user_id,
            encrypted_data, recipient_name, share_note,
            include_completed, include_tomorrow,
            expires_at, created_by_device
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $shareId,
        $token,
        $data['sync_id'],
        $data['user_id'],
        $encryptedData,
        $data['recipient_name'] ?? null,
        $data['share_note'] ?? null,
        $data['include_completed'] ?? true,
        $data['include_tomorrow'] ?? true,
        $expiresAt,
        $data['device_name'] ?? 'Unknown Device'
    ]);
    
    // Generate environment-appropriate share URL
    $isQual = strpos($_SERVER['REQUEST_URI'] ?? '', '/qual/') !== false;
    $shareUrl = $isQual 
        ? 'https://stackmap.app/qual/?share=' . $token
        : 'https://stackmap.app?share=' . $token;
    
    // Return success with share URL
    echo json_encode([
        'success' => true,
        'share_id' => $shareId,
        'access_token' => $token,
        'expires_at' => $expiresAt,
        'share_url' => $shareUrl
    ]);
    
} catch (Exception $e) {
    error_log('Create share error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>