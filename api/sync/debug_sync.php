<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'database.php';

$sync_id = $_GET['sync_id'] ?? '';

if (!$sync_id) {
    echo json_encode(['error' => 'sync_id required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get sync group info
    $group_stmt = $db->prepare("
        SELECT *, UNIX_TIMESTAMP(created_at) * 1000 as created_ts
        FROM sync_groups 
        WHERE sync_id = ?
    ");
    $group_stmt->execute([$sync_id]);
    $group = $group_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get all records for this sync
    $records_stmt = $db->prepare("
        SELECT 
            id,
            device_id,
            client_timestamp,
            LENGTH(encrypted_blob) as blob_size,
            SUBSTRING(encrypted_blob, 1, 100) as blob_preview,
            server_timestamp,
            UNIX_TIMESTAMP(server_timestamp) * 1000 as server_ts
        FROM sync_records
        WHERE sync_id = ?
        ORDER BY client_timestamp DESC
    ");
    $records_stmt->execute([$sync_id]);
    $records = $records_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all devices
    $devices_stmt = $db->prepare("
        SELECT 
            device_id,
            push_count,
            first_seen,
            last_seen,
            TIMESTAMPDIFF(SECOND, first_seen, NOW()) as seconds_since_join
        FROM sync_devices
        WHERE sync_id = ?
    ");
    $devices_stmt->execute([$sync_id]);
    $devices = $devices_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'sync_id' => $sync_id,
        'group_exists' => !!$group,
        'group_info' => $group,
        'total_records' => count($records),
        'records' => $records,
        'total_devices' => count($devices),
        'devices' => $devices,
        'debug_info' => [
            'server_time' => date('Y-m-d H:i:s'),
            'server_timestamp_ms' => round(microtime(true) * 1000)
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>