<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

require_once 'database.php';

try {
    // Get parameters
    $sync_id = $_GET['sync_id'] ?? '';
    $device_id = $_GET['device_id'] ?? '';
    $since = intval($_GET['since'] ?? 0);
    
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
    
    // Register device if it doesn't exist
    $register_stmt = $db->prepare("
        INSERT INTO sync_devices (sync_id, device_id, first_seen, push_count)
        VALUES (?, ?, NOW(), 0)
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $register_stmt->execute([$sync_id, $device_id]);
    
    // Pull records newer than the requested timestamp
    // For initial sync (since=0), include ALL records to ensure new devices can get data
    // For incremental sync (since>0), exclude our own device to prevent pulling our own changes
    if ($since == 0) {
        // Initial pull - get ALL records (including our own for new devices joining)
        $pull_stmt = $db->prepare("
            SELECT 
                id,
                device_id,
                client_timestamp as timestamp,
                encrypted_blob,
                UNIX_TIMESTAMP(server_timestamp) * 1000 as server_timestamp
            FROM sync_records
            WHERE sync_id = ? 
                AND client_timestamp > ?
            ORDER BY client_timestamp ASC
            LIMIT 100
        ");
        $pull_stmt->execute([$sync_id, $since]);
    } else {
        // Incremental pull - exclude our own device's records
        $pull_stmt = $db->prepare("
            SELECT 
                id,
                device_id,
                client_timestamp as timestamp,
                encrypted_blob,
                UNIX_TIMESTAMP(server_timestamp) * 1000 as server_timestamp
            FROM sync_records
            WHERE sync_id = ? 
                AND client_timestamp > ?
                AND device_id != ?
            ORDER BY client_timestamp ASC
            LIMIT 100
        ");
        $pull_stmt->execute([$sync_id, $since, $device_id]);
    }
    
    $records = [];
    while ($row = $pull_stmt->fetch(PDO::FETCH_ASSOC)) {
        $records[] = [
            'id' => intval($row['id']),
            'device_id' => $row['device_id'],
            'timestamp' => intval($row['timestamp']),
            'server_timestamp' => intval($row['server_timestamp']),
            'encrypted_blob' => $row['encrypted_blob']
        ];
    }
    
    // Get device info
    $device_stmt = $db->prepare("
        SELECT 
            TIMESTAMPDIFF(SECOND, first_seen, NOW()) as seconds_since_join,
            push_count
        FROM sync_devices
        WHERE sync_id = ? AND device_id = ?
    ");
    $device_stmt->execute([$sync_id, $device_id]);
    $device_info = $device_stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'sync_id' => $sync_id,
        'records' => $records,
        'server_time' => round(microtime(true) * 1000),
        'device_info' => [
            'seconds_since_join' => intval($device_info['seconds_since_join'] ?? 0),
            'push_count' => intval($device_info['push_count'] ?? 0)
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Pull timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>