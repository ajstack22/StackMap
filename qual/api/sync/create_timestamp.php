<?php
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
    
    if (!$input || !isset($input['sync_id']) || !isset($input['encrypted_blob']) || 
        !isset($input['device_id']) || !isset($input['timestamp'])) {
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
    
    $conn = getConnection();
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Check if sync group already exists
        $check_stmt = $conn->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
        $check_stmt->bind_param("s", $sync_id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Sync group already exists - this is a join, not a create
            $conn->rollback();
            http_response_code(409);
            echo json_encode(['error' => 'Sync group already exists', 'sync_id' => $sync_id]);
            exit();
        }
        
        // Create new sync group
        $group_stmt = $conn->prepare("INSERT INTO sync_groups (sync_id) VALUES (?)");
        $group_stmt->bind_param("s", $sync_id);
        $group_stmt->execute();
        
        // Add device to sync group
        $device_stmt = $conn->prepare("INSERT INTO sync_devices (sync_id, device_id) VALUES (?, ?)");
        $device_stmt->bind_param("ss", $sync_id, $device_id);
        $device_stmt->execute();
        
        // Insert first sync record
        $record_stmt = $conn->prepare("
            INSERT INTO sync_records (sync_id, device_id, client_timestamp, encrypted_blob)
            VALUES (?, ?, ?, ?)
        ");
        $record_stmt->bind_param("ssds", $sync_id, $device_id, $client_timestamp, $encrypted_blob);
        $record_stmt->execute();
        
        $record_id = $conn->insert_id;
        
        // Commit transaction
        $conn->commit();
        
        // Return success
        echo json_encode([
            'success' => true,
            'sync_id' => $sync_id,
            'device_id' => $device_id,
            'record_id' => $record_id,
            'server_time' => round(microtime(true) * 1000)
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log('Create timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>