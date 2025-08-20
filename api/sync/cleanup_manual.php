<?php
/**
 * Manual cleanup script for StackMap sync data
 * Web-accessible version with authentication
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple authentication - you should change this secret!
$secret = $_GET['secret'] ?? '';
if ($secret !== 'your-secret-key-here') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once 'config.php';
require_once 'database.php';

// Optional: specify months via parameter (default 6)
$months = isset($_GET['months']) ? intval($_GET['months']) : 6;
if ($months < 1 || $months > 24) {
    $months = 6;
}

// Optional: dry run mode
$dryRun = isset($_GET['dry_run']) && $_GET['dry_run'] === 'true';

try {
    $db = Database::getInstance()->getConnection();
    
    // Calculate stale date
    $staleDate = date('Y-m-d H:i:s', strtotime("-$months months"));
    
    $result = [
        'dry_run' => $dryRun,
        'months_threshold' => $months,
        'stale_date' => $staleDate,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Find stale sync data
    $staleSyncIds = $db->prepare("
        SELECT sync_id, updated_at, 
               LENGTH(encrypted_blob) as blob_size,
               version
        FROM sync_data 
        WHERE updated_at < ?
        ORDER BY updated_at ASC
    ");
    $staleSyncIds->execute([$staleDate]);
    $staleData = $staleSyncIds->fetchAll(PDO::FETCH_ASSOC);
    
    $result['stale_sync_data'] = $staleData;
    $result['stale_count'] = count($staleData);
    
    if (count($staleData) > 0 && !$dryRun) {
        $db->beginTransaction();
        
        $syncIdsToDelete = array_column($staleData, 'sync_id');
        $placeholders = implode(',', array_fill(0, count($syncIdsToDelete), '?'));
        
        // Delete shares
        $deleteShares = $db->prepare("DELETE FROM shares WHERE sync_id IN ($placeholders)");
        $deleteShares->execute($syncIdsToDelete);
        $result['shares_deleted'] = $deleteShares->rowCount();
        
        // Delete devices
        $deleteDevices = $db->prepare("DELETE FROM sync_devices WHERE sync_id IN ($placeholders)");
        $deleteDevices->execute($syncIdsToDelete);
        $result['devices_deleted'] = $deleteDevices->rowCount();
        
        // Delete sync data
        $deleteSyncData = $db->prepare("DELETE FROM sync_data WHERE sync_id IN ($placeholders)");
        $deleteSyncData->execute($syncIdsToDelete);
        $result['sync_data_deleted'] = $deleteSyncData->rowCount();
        
        $db->commit();
    }
    
    // Check expired shares
    $expiredShares = $db->query("
        SELECT COUNT(*) as count 
        FROM shares 
        WHERE expires_at < NOW()
    ")->fetch();
    
    $result['expired_shares_count'] = $expiredShares['count'];
    
    if (!$dryRun && $expiredShares['count'] > 0) {
        $deleteExpired = $db->exec("DELETE FROM shares WHERE expires_at < NOW()");
        $result['expired_shares_deleted'] = $deleteExpired;
    }
    
    // Current database stats
    $stats = [
        'total_sync_data' => $db->query("SELECT COUNT(*) FROM sync_data")->fetchColumn(),
        'total_shares' => $db->query("SELECT COUNT(*) FROM shares")->fetchColumn(),
        'total_devices' => $db->query("SELECT COUNT(*) FROM sync_devices")->fetchColumn(),
        'oldest_sync' => $db->query("SELECT MIN(updated_at) FROM sync_data")->fetchColumn(),
        'newest_sync' => $db->query("SELECT MAX(updated_at) FROM sync_data")->fetchColumn()
    ];
    
    $result['current_stats'] = $stats;
    $result['success'] = true;
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}
?>