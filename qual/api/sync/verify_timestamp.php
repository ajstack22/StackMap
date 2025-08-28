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

try {
    require_once 'database.php';
    
    // Get sync_id from query parameter
    $sync_id = $_GET['sync_id'] ?? '';
    
    // Validate input
    if (!preg_match('/^[a-f0-9]{32}$/', $sync_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid sync_id format']);
        exit();
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if sync group exists
    $check_stmt = $db->prepare("
        SELECT 
            sg.sync_id,
            UNIX_TIMESTAMP(sg.created_at) * 1000 as created_timestamp,
            UNIX_TIMESTAMP(sg.last_activity) * 1000 as last_activity_timestamp,
            COUNT(DISTINCT sr.id) as record_count,
            COUNT(DISTINCT sd.device_id) as device_count,
            MAX(sr.client_timestamp) as latest_timestamp
        FROM sync_groups sg
        LEFT JOIN sync_records sr ON sg.sync_id = sr.sync_id
        LEFT JOIN sync_devices sd ON sg.sync_id = sd.sync_id
        WHERE sg.sync_id = ?
        GROUP BY sg.sync_id
    ");
    $check_stmt->execute([$sync_id]);
    
    $sync_info = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sync_info) {
        // Sync group doesn't exist
        echo json_encode([
            'exists' => false,
            'sync_id' => $sync_id
        ]);
        exit();
    }
    
    // Return sync group information
    echo json_encode([
        'exists' => true,
        'sync_id' => $sync_id,
        'created_at' => intval($sync_info['created_timestamp']),
        'last_activity' => intval($sync_info['last_activity_timestamp']),
        'record_count' => intval($sync_info['record_count']),
        'device_count' => intval($sync_info['device_count']),
        'latest_timestamp' => intval($sync_info['latest_timestamp']),
        'server_time' => round(microtime(true) * 1000)
    ]);
    
} catch (Exception $e) {
    error_log('Verify timestamp error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>