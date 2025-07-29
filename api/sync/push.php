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
