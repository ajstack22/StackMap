<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'database.php';

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['sync_id']) || !isset($data['encrypted_blob']) || !isset($data['device_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: sync_id, encrypted_blob, device_id']);
    exit();
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
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Sync group not found']);
        exit();
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
    $versionStmt = $db->prepare("SELECT version, updated_at FROM sync_data WHERE sync_id = ?");
    $versionStmt->execute([$data['sync_id']]);
    $versionData = $versionStmt->fetch();

    // Try to log metric but don't fail if table doesn't exist
    try {
        $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
        $metric->execute(['sync_push', json_encode([
            'sync_id' => $data['sync_id'],
            'device_id' => $data['device_id'],
            'blob_size' => strlen($data['encrypted_blob'])
        ])]);
    } catch (Exception $e) {
        // Ignore metrics errors
    }

    // Return success response
    echo json_encode([
        'success' => true,
        'version' => $versionData['version'],
        'last_modified' => $versionData['updated_at']
    ]);

} catch (Exception $e) {
    error_log("Push error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Push failed: ' . $e->getMessage()]);
}
