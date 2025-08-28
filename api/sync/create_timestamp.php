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

if (!$data || !isset($data['sync_id']) || !isset($data['encrypted_blob']) || 
    !isset($data['device_id']) || !isset($data['timestamp'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if sync group already exists
    $checkStmt = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
    $checkStmt->execute([$data['sync_id']]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'Sync group already exists'
        ]);
        exit();
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    // Create sync group
    $groupStmt = $db->prepare("
        INSERT INTO sync_groups (sync_id, total_records, active_devices)
        VALUES (?, 1, 1)
    ");
    $groupStmt->execute([$data['sync_id']]);
    
    // Add first sync record
    $recordStmt = $db->prepare("
        INSERT INTO sync_records (sync_id, device_id, client_timestamp, encrypted_blob)
        VALUES (?, ?, ?, ?)
    ");
    $recordStmt->execute([
        $data['sync_id'],
        $data['device_id'],
        $data['timestamp'],
        $data['encrypted_blob']
    ]);
    
    // Register device (creator can push immediately)
    $deviceStmt = $db->prepare("
        INSERT INTO sync_devices (
            device_id, 
            sync_id, 
            device_name, 
            last_sync_timestamp,
            can_push_after
        )
        VALUES (?, ?, 'Creator Device', ?, NOW())
    ");
    $deviceStmt->execute([
        $data['device_id'],
        $data['sync_id'],
        $data['timestamp']
    ]);
    
    // Commit transaction
    $db->commit();
    
    error_log("Create sync: Successfully created sync_id " . $data['sync_id']);
    
    // Return success
    echo json_encode([
        'success' => true,
        'sync_id' => $data['sync_id'],
        'timestamp' => $data['timestamp'],
        'server_timestamp' => round(microtime(true) * 1000)
    ]);
    
} catch (Exception $e) {
    $db->rollback();
    error_log('Create sync error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create sync group']);
}
?>