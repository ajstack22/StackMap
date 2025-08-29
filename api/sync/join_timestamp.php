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

try {
    require_once 'database.php';
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['sync_id']) || !isset($input['device_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }
    
    $sync_id = $input['sync_id'];
    $device_id = $input['device_id'];
    
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
    
    // Check if sync group exists
    $check_stmt = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
    $check_stmt->execute([$sync_id]);
    
    if (!$check_stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Sync group not found']);
        exit();
    }
    
    // Add device to sync group (no protection period needed with conflict resolution)
    $device_stmt = $db->prepare("
        INSERT INTO sync_devices (sync_id, device_id, first_seen, push_count)
        VALUES (?, ?, NOW(), 0)
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $device_stmt->execute([$sync_id, $device_id]);
    
    // Get latest sync record to return to the joining device
    $latest_stmt = $db->prepare("
        SELECT 
            id,
            device_id,
            client_timestamp as timestamp,
            encrypted_blob,
            UNIX_TIMESTAMP(server_timestamp) * 1000 as server_timestamp
        FROM sync_records
        WHERE sync_id = ?
        ORDER BY client_timestamp DESC
        LIMIT 1
    ");
    $latest_stmt->execute([$sync_id]);
    
    $latest_record = $latest_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$latest_record) {
        // No records yet - this shouldn't happen for a join
        http_response_code(404);
        echo json_encode(['error' => 'No sync data found']);
        exit();
    }
    
    // Return success with the latest record
    echo json_encode([
        'success' => true,
        'sync_id' => $sync_id,
        'device_id' => $device_id,
        'latest_record' => [
            'id' => intval($latest_record['id']),
            'timestamp' => intval($latest_record['timestamp']),
            'server_timestamp' => intval($latest_record['server_timestamp']),
            'encrypted_blob' => $latest_record['encrypted_blob']
        ],
        'server_time' => round(microtime(true) * 1000)
        // No protection period needed with conflict resolution
    ]);
    
} catch (Exception $e) {
    error_log('Join timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>