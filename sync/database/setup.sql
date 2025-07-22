cat > ~/public_html/api/sync/create.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();
$data = getJsonInput();

// Validate required fields
if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) ||
!isset($data['recovery_salt'])) {
    sendError('Missing required fields: sync_id, encrypted_blob, 
recovery_salt');
}

try {
    $db = Database::getInstance()->getConnection();

    // Check if sync_id already exists
    $check = $db->prepare("SELECT sync_id FROM sync_data WHERE sync_id = 
?");
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
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) 
VALUES (?, ?)");
    $metric->execute(['sync_created', json_encode(['sync_id' =>
$data['sync_id']])]);

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

if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) ||
!isset($data['device_id'])) {
    sendError('Missing required fields: sync_id, encrypted_blob, 
device_id');
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
    $versionStmt = $db->prepare("SELECT version, last_modified FROM 
sync_data WHERE sync_id = ?");
    $versionStmt->execute([$data['sync_id']]);
    $versionData = $versionStmt->fetch();

    // Log metric
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) 
VALUES (?, ?)");
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
    $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) 
VALUES (?, ?)");
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

# Set permissions
chmod 644 ~/public_html/api/sync/*.php

echo "✅ All API endpoints created!"