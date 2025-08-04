<?php
/**
 * TEST Cleanup script for StackMap sync data
 * Removes data not modified in 1 HOUR for testing
 * DO NOT USE IN PRODUCTION
 */

// Allow running from CLI only for security
if (php_sapi_name() !== 'cli') {
    header('HTTP/1.0 403 Forbidden');
    exit('This script can only be run from command line');
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

// Set timezone
date_default_timezone_set('UTC');

echo "[" . date('Y-m-d H:i:s') . "] Starting sync data cleanup...\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Start transaction
    $db->beginTransaction();
    
    // 1. Get sync_ids that haven't been updated in 1 hour (TEST MODE)
    $staleDate = date('Y-m-d H:i:s', strtotime('-1 hour'));
    echo "TEST MODE: Cleaning up data not modified since: $staleDate\n";
    
    $staleSyncIds = $db->prepare("
        SELECT sync_id, updated_at 
        FROM sync_data 
        WHERE updated_at < ?
    ");
    $staleSyncIds->execute([$staleDate]);
    $staleIds = $staleSyncIds->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($staleIds) > 0) {
        echo "Found " . count($staleIds) . " stale sync entries:\n";
        foreach ($staleIds as $stale) {
            echo "  - Sync ID: {$stale['sync_id']}, Last updated: {$stale['updated_at']}\n";
        }
        
        // Extract just the sync_ids for deletion
        $syncIdsToDelete = array_column($staleIds, 'sync_id');
        $placeholders = implode(',', array_fill(0, count($syncIdsToDelete), '?'));
        
        // 2. Delete associated shares (expired or not)
        $deleteShares = $db->prepare("
            DELETE FROM shares 
            WHERE sync_id IN ($placeholders)
        ");
        $deleteShares->execute($syncIdsToDelete);
        $sharesDeleted = $deleteShares->rowCount();
        echo "Deleted $sharesDeleted share(s)\n";
        
        // 3. Delete associated devices
        $deleteDevices = $db->prepare("
            DELETE FROM sync_devices 
            WHERE sync_id IN ($placeholders)
        ");
        $deleteDevices->execute($syncIdsToDelete);
        $devicesDeleted = $deleteDevices->rowCount();
        echo "Deleted $devicesDeleted device(s)\n";
        
        // 4. Delete the sync data itself
        $deleteSyncData = $db->prepare("
            DELETE FROM sync_data 
            WHERE sync_id IN ($placeholders)
        ");
        $deleteSyncData->execute($syncIdsToDelete);
        $syncDataDeleted = $deleteSyncData->rowCount();
        echo "Deleted $syncDataDeleted sync data entries\n";
    } else {
        echo "No stale sync data found\n";
    }
    
    // 5. Clean up expired shares (regardless of sync data age)
    $deleteExpiredShares = $db->prepare("
        DELETE FROM shares 
        WHERE expires_at < NOW()
    ");
    $deleteExpiredShares->execute();
    $expiredSharesDeleted = $deleteExpiredShares->rowCount();
    if ($expiredSharesDeleted > 0) {
        echo "Deleted $expiredSharesDeleted expired share(s)\n";
    }
    
    // Commit transaction
    $db->commit();
    
    // 6. Log summary
    $summary = [
        'timestamp' => date('Y-m-d H:i:s'),
        'stale_sync_data_deleted' => count($staleIds),
        'shares_deleted' => $sharesDeleted ?? 0,
        'devices_deleted' => $devicesDeleted ?? 0,
        'expired_shares_deleted' => $expiredSharesDeleted
    ];
    
    echo "\nCleanup Summary:\n";
    echo json_encode($summary, JSON_PRETTY_PRINT) . "\n";
    
    // Optionally log to file
    $logFile = __DIR__ . '/cleanup.log';
    file_put_contents($logFile, json_encode($summary) . "\n", FILE_APPEND | LOCK_EX);
    
    echo "\n[" . date('Y-m-d H:i:s') . "] Cleanup completed successfully\n";
    
} catch (Exception $e) {
    // Rollback on error
    if ($db->inTransaction()) {
        $db->rollback();
    }
    
    echo "ERROR: " . $e->getMessage() . "\n";
    
    // Log error
    $errorLog = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ];
    
    $logFile = __DIR__ . '/cleanup_errors.log';
    file_put_contents($logFile, json_encode($errorLog) . "\n", FILE_APPEND | LOCK_EX);
    
    exit(1);
}
?>