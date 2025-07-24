<?php
/**
 * StackMap Sync - Delete Sync Data
 * 
 * Allows users to permanently delete their sync data from the server.
 * Requires both sync_id and device_id for security.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$sync_id = $input['sync_id'] ?? '';
$device_id = $input['device_id'] ?? '';
$confirm_phrase = $input['confirm_phrase'] ?? '';

if (!$sync_id || !$device_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing sync_id or device_id']);
    exit;
}

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/RateLimiter.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Rate limiting by IP
    $rateLimiter = new RateLimiter($pdo);
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    if (!$rateLimiter->checkLimit($client_ip, 'delete', 5, 3600)) { // 5 deletes per hour
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded']);
        exit;
    }
    
    // Verify the device belongs to this sync group
    $verify_stmt = $pdo->prepare("
        SELECT s.sync_id, s.version, s.device_count 
        FROM sync_data s
        JOIN sync_devices d ON s.sync_id = d.sync_id
        WHERE s.sync_id = :sync_id AND d.device_id = :device_id
    ");
    $verify_stmt->execute([
        'sync_id' => $sync_id,
        'device_id' => $device_id
    ]);
    
    $sync_data = $verify_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sync_data) {
        http_response_code(404);
        echo json_encode(['error' => 'Sync data not found or device not authorized']);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Log the deletion request (anonymous metrics)
        $log_stmt = $pdo->prepare("
            INSERT INTO sync_metrics (event, metadata) 
            VALUES ('sync_data_deleted', :metadata)
        ");
        $log_stmt->execute([
            'metadata' => json_encode([
                'device_count' => $sync_data['device_count'],
                'version' => $sync_data['version'],
                'initiated_by_device' => substr($device_id, 0, 8) . '...', // Partial ID for privacy
                'timestamp' => date('Y-m-d H:i:s')
            ])
        ]);
        
        // Delete the sync data (CASCADE will handle devices and pairing sessions)
        $delete_stmt = $pdo->prepare("DELETE FROM sync_data WHERE sync_id = :sync_id");
        $delete_stmt->execute(['sync_id' => $sync_id]);
        
        // Commit transaction
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'All sync data has been permanently deleted',
            'deleted' => [
                'sync_group' => true,
                'devices' => $sync_data['device_count'],
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log('Delete sync error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to delete sync data',
        'message' => 'An error occurred while deleting your data'
    ]);
}
?>