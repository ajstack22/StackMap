#!/bin/bash
# Create the remaining sync API endpoints

echo "📝 Creating sync API endpoints..."

# Create the 'create' endpoint
cat > ~/public_html/api/sync/create.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();
$data = getJsonInput();

// Validate required fields
if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) || !isset($data['recovery_salt'])) {
    sendError('Missing required fields: sync_id, encrypted_blob, recovery_salt');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if sync_id already exists
    $check = $db->prepare("SELECT sync_id FROM sync_data WHERE sync_id = ?");
    $check->execute([$data['sync_id']]);
    if ($check->rowCount() > 0) {
        sendError('Sync ID already exists', 409);
    }
    
    // Create new sync group
    $stmt = $db->prepare("
        INSERT INTO sync_data (sync_id, encrypted_blob, recovery_salt)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([
        $data['sync_id'],
        $data['encrypted_blob'],
        $data['recovery_salt']
    ]);
    
    // Log metric
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
    $metric->execute(['sync_created', json_encode(['sync_id' => $data['sync_id']])]);
    
    sendResponse(['success' => true, 'sync_id' => $data['sync_id']], 201);
    
} catch (Exception $e) {
    error_log("Create sync error: " . $e->getMessage());
    sendError('Failed to create sync group', 500);
}
EOF

# Create the 'push' endpoint
cat > ~/public_html/api/sync/push.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();
$data = getJsonInput();

if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) || !isset($data['device_id'])) {
    sendError('Missing required fields: sync_id, encrypted_blob, device_id');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Update sync data
    $stmt = $db->prepare("
        UPDATE sync_data 
        SET encrypted_blob = ?, version = version + 1
        WHERE sync_id = ?
    ");
    $stmt->execute([$data['encrypted_blob'], $data['sync_id']]);
    
    if ($stmt->rowCount() === 0) {
        sendError('Sync group not found', 404);
    }
    
    // Update or insert device
    $deviceStmt = $db->prepare("
        INSERT INTO sync_devices (device_id, sync_id, device_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP
    ");
    $deviceStmt->execute([
        $data['device_id'],
        $data['sync_id'],
        $data['device_name'] ?? 'Unknown Device'
    ]);
    
    // Get updated version
    $versionStmt = $db->prepare("SELECT version, last_modified FROM sync_data WHERE sync_id = ?");
    $versionStmt->execute([$data['sync_id']]);
    $versionData = $versionStmt->fetch();
    
    // Log metric
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
    $metric->execute(['sync_push', json_encode([
        'sync_id' => $data['sync_id'],
        'device_id' => $data['device_id'],
        'blob_size' => strlen($data['encrypted_blob'])
    ])]);
    
    sendResponse([
        'success' => true,
        'version' => $versionData['version'],
        'last_modified' => $versionData['last_modified']
    ]);
    
} catch (Exception $e) {
    error_log("Push error: " . $e->getMessage());
    sendError('Push failed', 500);
}
EOF

# Create the 'pull' endpoint
cat > ~/public_html/api/sync/pull.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();

// Get parameters
$sync_id = $_GET['sync_id'] ?? null;
$device_id = $_GET['device_id'] ?? null;

if (!$sync_id || !$device_id) {
    sendError('Missing required parameters: sync_id, device_id');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get sync data
    $stmt = $db->prepare("
        SELECT encrypted_blob, version, last_modified
        FROM sync_data
        WHERE sync_id = ?
    ");
    $stmt->execute([$sync_id]);
    
    $result = $stmt->fetch();
    if (!$result) {
        sendError('Sync group not found', 404);
    }
    
    // Update device last seen
    $deviceStmt = $db->prepare("
        UPDATE sync_devices 
        SET last_seen = CURRENT_TIMESTAMP
        WHERE device_id = ? AND sync_id = ?
    ");
    $deviceStmt->execute([$device_id, $sync_id]);
    
    // Log metric
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
    $metric->execute(['sync_pull', json_encode([
        'sync_id' => $sync_id,
        'device_id' => $device_id
    ])]);
    
    sendResponse([
        'encrypted_blob' => $result['encrypted_blob'],
        'version' => $result['version'],
        'last_modified' => $result['last_modified']
    ]);
    
} catch (Exception $e) {
    error_log("Pull error: " . $e->getMessage());
    sendError('Pull failed', 500);
}
EOF

# Create a simple rate limiter
cat > ~/public_html/api/utils/rate-limit.php << 'EOF'
<?php
/**
 * Simple rate limiting
 */

function checkRateLimit($endpoint, $identifier, $maxRequests = 100, $windowMinutes = 60) {
    require_once '../config/database.php';
    
    try {
        $db = Database::getInstance()->getConnection();
        
        // Clean old entries
        $db->exec("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL $windowMinutes MINUTE)");
        
        // Check current rate
        $stmt = $db->prepare("
            SELECT request_count 
            FROM rate_limits 
            WHERE identifier = ? AND endpoint = ? 
            AND window_start > DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ");
        $stmt->execute([$identifier, $endpoint, $windowMinutes]);
        
        $result = $stmt->fetch();
        $currentCount = $result ? $result['request_count'] : 0;
        
        if ($currentCount >= $maxRequests) {
            sendError('Rate limit exceeded', 429);
        }
        
        // Update count
        $update = $db->prepare("
            INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE request_count = request_count + 1
        ");
        $update->execute([$identifier, $endpoint]);
        
    } catch (Exception $e) {
        // Don't fail the request if rate limiting fails
        error_log("Rate limit error: " . $e->getMessage());
    }
}
EOF

# Set permissions
chmod 644 ~/public_html/api/sync/*.php
chmod 644 ~/public_html/api/utils/*.php

echo "✅ All API endpoints created!"
echo ""
echo "📋 Available endpoints:"
echo "  ✅ https://stackmap.app/api/sync/test.php    (GET: Test connection)"
echo "  📝 https://stackmap.app/api/sync/create.php  (POST: Create sync group)"
echo "  ⬆️  https://stackmap.app/api/sync/push.php    (POST: Push encrypted data)"
echo "  ⬇️  https://stackmap.app/api/sync/pull.php    (GET: Pull encrypted data)"
echo ""
echo "🧪 Next step: Test creating a sync group with curl or Postman"