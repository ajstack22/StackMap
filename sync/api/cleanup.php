<?php
/**
 * StackMap Sync - Database Cleanup Endpoint
 * 
 * This endpoint should be called by a cron job to clean up old data.
 * For security, it checks for a secret key that should be set in cron.
 * 
 * Example cron entry (runs daily at 3 AM):
 * 0 3 * * * curl -X POST https://stackmap.app/api/sync/cleanup.php -H "X-Cleanup-Key: your-secret-key-here"
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: X-Cleanup-Key');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check for cleanup key in header
$cleanup_key = $_SERVER['HTTP_X_CLEANUP_KEY'] ?? '';
$expected_key = getenv('SYNC_CLEANUP_KEY') ?: 'change-this-secret-key';

if ($cleanup_key !== $expected_key) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/lib/db.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Start transaction
    $pdo->beginTransaction();
    
    // First, get stats on what will be deleted
    $stats_query = "
        SELECT 
            COUNT(*) as inactive_count,
            MIN(last_modified) as oldest_date,
            SUM(device_count) as total_devices
        FROM sync_data 
        WHERE last_modified < DATE_SUB(NOW(), INTERVAL 6 MONTH)
    ";
    
    $stmt = $pdo->query($stats_query);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log the cleanup action
    $log_stmt = $pdo->prepare("
        INSERT INTO sync_metrics (event, metadata) 
        VALUES ('cleanup_started', :metadata)
    ");
    $log_stmt->execute([
        'metadata' => json_encode([
            'inactive_count' => $stats['inactive_count'],
            'oldest_date' => $stats['oldest_date'],
            'total_devices' => $stats['total_devices']
        ])
    ]);
    
    // Delete inactive sync data (CASCADE will handle devices)
    $delete_stmt = $pdo->prepare("
        DELETE FROM sync_data 
        WHERE last_modified < DATE_SUB(NOW(), INTERVAL 6 MONTH)
    ");
    $delete_stmt->execute();
    $deleted_count = $delete_stmt->rowCount();
    
    // Clean up expired pairing sessions
    $pdo->exec("DELETE FROM pairing_sessions WHERE expires_at < NOW()");
    
    // Clean up old rate limits
    $pdo->exec("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    
    // Clean up metrics older than 1 year
    $metrics_stmt = $pdo->prepare("
        DELETE FROM sync_metrics 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
    ");
    $metrics_stmt->execute();
    $deleted_metrics = $metrics_stmt->rowCount();
    
    // Log completion
    $complete_stmt = $pdo->prepare("
        INSERT INTO sync_metrics (event, metadata) 
        VALUES ('cleanup_completed', :metadata)
    ");
    $complete_stmt->execute([
        'metadata' => json_encode([
            'deleted_sync_groups' => $deleted_count,
            'deleted_metrics' => $deleted_metrics
        ])
    ]);
    
    // Commit transaction
    $pdo->commit();
    
    // Return summary
    echo json_encode([
        'success' => true,
        'cleanup_summary' => [
            'deleted_sync_groups' => $deleted_count,
            'deleted_devices' => $stats['total_devices'] ?? 0,
            'deleted_metrics' => $deleted_metrics,
            'oldest_removed' => $stats['oldest_date'],
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log('Cleanup error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Cleanup failed',
        'message' => 'An error occurred during cleanup'
    ]);
}
?>