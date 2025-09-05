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
    
    // Accept both V2 and V3 encrypted shares
    $version = $data['share_version'] ?? 2;
    if (!in_array($version, [2, 3])) {
        throw new Exception('Invalid share version. Supported versions: 2, 3');
    }
    
    // V2 required fields
    $required = ['sync_id', 'user_id', 'encrypted_data', 'access_token', 'expires_hours', 'share_version'];
    
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate V2 token format (base64-url encoded, 24+ chars)
    $token = $data['access_token'];
    if (!preg_match('/^[A-Za-z0-9_-]{24,}$/', $token)) {
        throw new Exception('Invalid token format. V2 tokens must be at least 24 characters.');
    }
    
    // Validate expiration hours (1-2160, max 3 months)
    $expiresHours = intval($data['expires_hours']);
    if ($expiresHours < 1 || $expiresHours > 2160) {
        throw new Exception('Expiration must be between 1 hour and 3 months (2160 hours)');
    }
    
    // Calculate expiration timestamp
    $expiresAt = date('Y-m-d H:i:s', time() + ($expiresHours * 3600));
    
    // V2 zero-knowledge share - client already filtered and encrypted the data
    $encryptedData = $data['encrypted_data'];
    
    // Validate it's properly formatted (base64)
    if (!preg_match('/^[A-Za-z0-9+\/]+=*$/', $encryptedData)) {
        throw new Exception('Invalid encrypted data format');
    }
    
    // Generate unique share ID
    // For V3, use shorter ID for cleaner URLs
    $shareId = ($version === 3) 
        ? substr(bin2hex(random_bytes(12)), 0, 16)  // 16 char ID for URL
        : bin2hex(random_bytes(16));  // Keep 32 char for V2
    
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
            expires_at, created_by_device, share_version, auto_update
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        $data['device_name'] ?? 'Unknown Device',
        $version,  // Store actual version
        $data['auto_update'] ?? false  // Auto-update flag
    ]);
    
    // Generate environment-appropriate share URL
    $isQual = strpos($_SERVER['REQUEST_URI'] ?? '', '/qual/') !== false;
    
    if ($version === 3) {
        // V3: Clean URL without token (client adds as fragment)
        $baseUrl = $isQual ? 'https://stackmap.app/qual' : 'https://stackmap.app';
        $shareUrl = $baseUrl . '/share/' . $shareId;
    } else {
        // V2: Legacy format with token in query
        $shareUrl = $isQual 
            ? 'https://stackmap.app/qual/?share=' . $token
            : 'https://stackmap.app?share=' . $token;
    }
    
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