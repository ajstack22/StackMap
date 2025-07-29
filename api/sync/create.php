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
