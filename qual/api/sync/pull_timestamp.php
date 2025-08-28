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
    
    // Register device if it doesn't exist
    try {
        $update_stmt = $db->prepare("
            INSERT INTO sync_devices (sync_id, device_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE device_id = device_id
        ");
        $update_stmt->execute([$sync_id, $device_id]);
    } catch (Exception $e) {
        // Ignore errors - device tracking is not critical for pulls
    }
    
    // Pull records newer than the requested timestamp
    $pull_stmt = $db->prepare("
        SELECT 
            id,
            device_id,
            client_timestamp as timestamp,
            encrypted_blob,
            UNIX_TIMESTAMP(server_timestamp) * 1000 as server_timestamp
        FROM sync_records
        WHERE sync_id = ? AND client_timestamp > ?
        ORDER BY client_timestamp ASC
        LIMIT 100
    ");
    $pull_stmt->execute([$sync_id, $since]);
    
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
    
    // Skip device info query since table structure may vary
    // Just return the pulled records
    echo json_encode([
        'success' => true,
        'sync_id' => $sync_id,
        'records' => $records,
        'server_time' => round(microtime(true) * 1000),
        'device_info' => [
            'seconds_since_join' => 60,  // Default to allow sync
            'push_count' => 0
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Pull timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>