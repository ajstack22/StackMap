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
