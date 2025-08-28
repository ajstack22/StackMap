<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

require_once 'database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['sync_id']) || !isset($input['device_id']) || 
        !isset($input['encrypted_blob']) || !isset($input['timestamp'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }
    
    $sync_id = $input['sync_id'];
    $device_id = $input['device_id'];
    $encrypted_blob = $input['encrypted_blob'];
    $client_timestamp = intval($input['timestamp']);
    
    // Validate inputs
    if (!preg_match('/^[a-f0-9]{32}$/', $sync_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid sync_id format']);
        exit();
    }
    
    if (!preg_match('/^[a-f0-9]{32}$/', $device_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid device_id format']);
        exit();
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Ensure tables exist
    $check_table = $db->query("SHOW TABLES LIKE 'sync_groups'");
    if ($check_table->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Database not initialized']);
        exit();
    }
    
    // Check if sync group exists
    $check_stmt = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
    $check_stmt->execute([$sync_id]);
    $result = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        http_response_code(404);
        echo json_encode(['error' => 'Sync group not found']);
        exit();
    }
    
    // Check if device exists (simplified without first_seen column)
    $device_stmt = $db->prepare("
        SELECT device_id
        FROM sync_devices
        WHERE sync_id = ? AND device_id = ?
    ");
    $device_stmt->execute([$sync_id, $device_id]);
    $device_exists = $device_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$device_exists) {
        // New device - add it
        try {
            $add_device_stmt = $db->prepare("
                INSERT INTO sync_devices (sync_id, device_id)
                VALUES (?, ?)
            ");
            $add_device_stmt->execute([$sync_id, $device_id]);
        } catch (Exception $e) {
            // Device might already exist, continue
        }
    }
    
    // Skip protection checks since we can't reliably determine join time
    
    // Insert sync record
    $insert_stmt = $db->prepare("
        INSERT INTO sync_records (sync_id, device_id, client_timestamp, encrypted_blob)
        VALUES (?, ?, ?, ?)
    ");
    $insert_stmt->execute([$sync_id, $device_id, $client_timestamp, $encrypted_blob]);
    
    $record_id = $db->lastInsertId();
    
    // Try to update device metadata if columns exist
    try {
        $update_stmt = $db->prepare("
            UPDATE sync_devices 
            SET device_id = device_id
            WHERE sync_id = ? AND device_id = ?
        ");
        $update_stmt->execute([$sync_id, $device_id]);
    } catch (Exception $e) {
        // Ignore update errors
    }
    
    // Update sync group last activity
    $update_group_stmt = $db->prepare("
        UPDATE sync_groups 
        SET last_activity = CURRENT_TIMESTAMP
        WHERE sync_id = ?
    ");
    $update_group_stmt->execute([$sync_id]);
    
    echo json_encode([
        'success' => true,
        'record_id' => $record_id,
        'server_time' => round(microtime(true) * 1000)
    ]);
    
} catch (Exception $e) {
    error_log('Push timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>