<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'database.php';

// Get parameters
$sync_id = $_GET['sync_id'] ?? null;
$device_id = $_GET['device_id'] ?? null;
$since_timestamp = $_GET['since'] ?? 0;  // Client's last sync timestamp

if (!$sync_id || !$device_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required parameters']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Register device if new (for protection tracking)
    $deviceStmt = $db->prepare("
        INSERT INTO sync_devices (device_id, sync_id, device_name, can_push_after)
        VALUES (?, ?, 'Web Browser', DATE_ADD(NOW(), INTERVAL 60 SECOND))
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $deviceStmt->execute([$device_id, $sync_id]);
    
    // Check if sync group exists
    $groupStmt = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
    $groupStmt->execute([$sync_id]);
    if (!$groupStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Sync group not found']);
        exit();
    }
    
    // Handle simultaneous join protection (stagger multiple devices joining)
    $recentJoinsStmt = $db->prepare("
        SELECT COUNT(*) as recent_joins
        FROM sync_devices
        WHERE sync_id = ? 
        AND first_seen > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    ");
    $recentJoinsStmt->execute([$sync_id]);
    $recentJoins = $recentJoinsStmt->fetchColumn();
    
    if ($recentJoins > 1) {
        // Add small random delay to prevent thundering herd
        $delay = rand(0, 3);
        error_log("[Sync] Staggering pull by {$delay}s due to {$recentJoins} recent joins");
        sleep($delay);
    }
    
    // Get all records newer than the client's last sync
    $recordsStmt = $db->prepare("
        SELECT 
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
    $recordsStmt->execute([$sync_id, $since_timestamp]);
    $records = $recordsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no records since timestamp, return the latest one
    if (empty($records) && $since_timestamp == 0) {
        $latestStmt = $db->prepare("
            SELECT 
                device_id,
                client_timestamp as timestamp,
                encrypted_blob,
                UNIX_TIMESTAMP(server_timestamp) * 1000 as server_timestamp
            FROM sync_records
            WHERE sync_id = ?
            ORDER BY client_timestamp DESC
            LIMIT 1
        ");
        $latestStmt->execute([$sync_id]);
        $latest = $latestStmt->fetch(PDO::FETCH_ASSOC);
        if ($latest) {
            $records = [$latest];
        }
    }
    
    // Calculate clock skew hint
    $serverTime = round(microtime(true) * 1000);
    
    // Return records
    echo json_encode([
        'success' => true,
        'records' => $records,
        'server_time' => $serverTime,
        'has_more' => count($records) >= 100  // Pagination hint
    ]);
    
} catch (Exception $e) {
    error_log('Sync pull error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
?>