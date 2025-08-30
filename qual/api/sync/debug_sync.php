<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'database.php';

// Get sync_id from query parameter
$sync_id = $_GET['sync_id'] ?? '';

if (!$sync_id || !preg_match('/^[a-f0-9]{32}$/', $sync_id)) {
    echo json_encode(['error' => 'Invalid or missing sync_id']);
    exit();
}

try {
    $db = getDatabase();
    
    // Get sync group info
    $group_stmt = $db->prepare("SELECT * FROM sync_groups WHERE sync_id = ?");
    $group_stmt->execute([$sync_id]);
    $group = $group_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$group) {
        echo json_encode(['error' => 'Sync group not found']);
        exit();
    }
    
    // Get devices
    $devices_stmt = $db->prepare("SELECT * FROM sync_devices WHERE sync_id = ? ORDER BY first_seen");
    $devices_stmt->execute([$sync_id]);
    $devices = $devices_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get records with blob size
    $records_stmt = $db->prepare("
        SELECT sync_id, device_id, client_timestamp, 
               LENGTH(encrypted_blob) as blob_size,
               SUBSTRING(encrypted_blob, 1, 100) as blob_preview
        FROM sync_records 
        WHERE sync_id = ? 
        ORDER BY client_timestamp DESC 
        LIMIT 10
    ");
    $records_stmt->execute([$sync_id]);
    $records = $records_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'sync_id' => $sync_id,
        'group' => $group,
        'devices' => $devices,
        'device_count' => count($devices),
        'records' => $records,
        'record_count' => count($records),
        'total_pushes' => array_sum(array_column($devices, 'push_count')),
        'analysis' => [
            'has_data' => count($records) > 0,
            'avg_blob_size' => count($records) > 0 ? 
                array_sum(array_column($records, 'blob_size')) / count($records) : 0,
            'last_push' => count($records) > 0 ? $records[0]['client_timestamp'] : null
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>