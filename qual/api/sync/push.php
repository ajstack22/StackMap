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
    
    // PROTECTION: Check if this device recently joined (within 30 seconds)
    $joinCheckStmt = $db->prepare("
        SELECT created_at, last_seen,
               TIMESTAMPDIFF(SECOND, created_at, NOW()) as seconds_since_join
        FROM sync_devices 
        WHERE device_id = ? AND sync_id = ?
    ");
    $joinCheckStmt->execute([$data['device_id'], $data['sync_id']]);
    $deviceInfo = $joinCheckStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($deviceInfo) {
        // If device joined less than 60 seconds ago, block the push
        if ($deviceInfo['seconds_since_join'] < 60) {
            http_response_code(429); // Too Many Requests
            echo json_encode([
                'success' => false, 
                'error' => 'Device must wait 60 seconds after joining before pushing',
                'seconds_to_wait' => 60 - $deviceInfo['seconds_since_join']
            ]);
            exit();
        }
    } else {
        // CRITICAL: Device doesn't exist yet - this is its first push after joining!
        // Block it for safety - new devices should pull first, not push
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'New device must wait before first push',
            'seconds_to_wait' => 60
        ]);
        exit();
    }
    
    // PROTECTION: Check for catastrophic data deletion
    // Get current data to compare
    $currentDataStmt = $db->prepare("SELECT encrypted_blob, version FROM sync_data WHERE sync_id = ?");
    $currentDataStmt->execute([$data['sync_id']]);
    $currentData = $currentDataStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($currentData && $currentData['encrypted_blob']) {
        // Try to decode and check activity count (this is a heuristic)
        // We can't decrypt but we can check blob size as a proxy
        $currentBlobSize = strlen($currentData['encrypted_blob']);
        $newBlobSize = strlen($data['encrypted_blob']);
        
        // If new blob is less than 50% of current, it might be data loss
        if ($currentBlobSize > 1000 && $newBlobSize < $currentBlobSize * 0.5) {
            error_log("WARNING: Device {$data['device_id']} attempting to reduce data from $currentBlobSize to $newBlobSize bytes");
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Rejected: Would delete too much data (>50% reduction)',
                'current_size' => $currentBlobSize,
                'new_size' => $newBlobSize
            ]);
            exit();
        }
    }
    
    $currentVersion = $currentData ? $currentData['version'] : 0;
    
    // If client sends a version number, validate it's reasonable
    if (isset($data['version'])) {
        $clientVersion = intval($data['version']);
        // Version should never jump by more than 2 (current + 1)
        if ($clientVersion > $currentVersion + 2) {
            error_log("WARNING: Device {$data['device_id']} sent version $clientVersion but current is $currentVersion");
            // Ignore client version, use server's version
            unset($data['version']);
        }
    }

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
        INSERT INTO sync_devices (device_id, sync_id, device_name, created_at, last_seen)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $deviceStmt->execute([
        $data['device_id'],
        $data['sync_id'],
        $data['device_name'] ?? 'Unknown Device'
    ]);

    // Get updated version
    $versionStmt = $db->prepare("SELECT version, updated_at FROM sync_data WHERE sync_id = ?");
    $versionStmt->execute([$data['sync_id']]);
    $result = $versionStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'version' => $result['version'],
        'last_modified' => $result['updated_at']
    ]);
} catch (Exception $e) {
    error_log('Sync push error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}