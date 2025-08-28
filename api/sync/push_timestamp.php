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
    
    // Check device protection (60-second block for new devices)
    $deviceStmt = $db->prepare("
        SELECT 
            first_seen,
            can_push_after,
            TIMESTAMPDIFF(SECOND, first_seen, NOW()) as seconds_since_join,
            TIMESTAMPDIFF(SECOND, NOW(), can_push_after) as seconds_to_wait
        FROM sync_devices 
        WHERE device_id = ? AND sync_id = ?
    ");
    $deviceStmt->execute([$data['device_id'], $data['sync_id']]);
    $deviceInfo = $deviceStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($deviceInfo) {
        // Check if device can push yet
        if ($deviceInfo['seconds_to_wait'] > 0) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Device must wait before pushing',
                'seconds_to_wait' => $deviceInfo['seconds_to_wait']
            ]);
            exit();
        }
    } else {
        // Device doesn't exist - it should pull first
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Device not registered. Please pull first to join sync group.'
        ]);
        exit();
    }
    
    // Check blob size for catastrophic data loss prevention
    $currentStmt = $db->prepare("
        SELECT encrypted_blob 
        FROM sync_records 
        WHERE sync_id = ? 
        ORDER BY client_timestamp DESC 
        LIMIT 1
    ");
    $currentStmt->execute([$data['sync_id']]);
    $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($current && strlen($current['encrypted_blob']) > 1000) {
        $newSize = strlen($data['encrypted_blob']);
        $currentSize = strlen($current['encrypted_blob']);
        
        // Reject if new data is less than 50% of current
        if ($newSize < $currentSize * 0.5) {
            error_log("WARNING: Device {$data['device_id']} attempting to reduce data from $currentSize to $newSize bytes");
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Rejected: Would delete too much data',
                'current_size' => $currentSize,
                'new_size' => $newSize
            ]);
            exit();
        }
    }
    
    // Store the sync record (immutable, append-only)
    $insertStmt = $db->prepare("
        INSERT INTO sync_records (sync_id, device_id, client_timestamp, encrypted_blob)
        VALUES (?, ?, ?, ?)
    ");
    $insertStmt->execute([
        $data['sync_id'],
        $data['device_id'],
        $data['timestamp'],
        $data['encrypted_blob']
    ]);
    
    // Update device last seen
    $updateDeviceStmt = $db->prepare("
        UPDATE sync_devices 
        SET last_sync_timestamp = ?
        WHERE device_id = ? AND sync_id = ?
    ");
    $updateDeviceStmt->execute([
        $data['timestamp'],
        $data['device_id'],
        $data['sync_id']
    ]);
    
    // Update sync group activity
    $updateGroupStmt = $db->prepare("
        UPDATE sync_groups 
        SET total_records = total_records + 1
        WHERE sync_id = ?
    ");
    $updateGroupStmt->execute([$data['sync_id']]);
    
    // Return success with the timestamp that was stored
    echo json_encode([
        'success' => true,
        'timestamp' => $data['timestamp'],
        'server_timestamp' => round(microtime(true) * 1000) // Server time in ms
    ]);
    
} catch (Exception $e) {
    error_log('Sync push error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
?>