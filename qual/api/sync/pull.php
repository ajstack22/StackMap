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

if (!$sync_id || !$device_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required parameters: sync_id, device_id']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();
    
    // PROTECTION: Handle simultaneous join race condition
    // Count recent joins to detect thundering herd
    $recentJoinsStmt = $db->prepare("
        SELECT COUNT(*) as recent_joins
        FROM sync_devices
        WHERE sync_id = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    ");
    $recentJoinsStmt->execute([$sync_id]);
    $recentJoins = $recentJoinsStmt->fetchColumn();
    
    if ($recentJoins > 1) {
        // Add random delay to stagger simultaneous joins
        $delay = rand(0, 10);
        error_log("[Sync] Staggering join by {$delay}s due to {$recentJoins} recent joins");
        sleep($delay);
    }

    // Get sync data
    $stmt = $db->prepare("
        SELECT encrypted_blob, version, updated_at
        FROM sync_data
        WHERE sync_id = ?
    ");
    $stmt->execute([$sync_id]);

    $result = $stmt->fetch();
    if (!$result) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Sync group not found']);
        exit();
    }

    // Create or update device record
    // IMPORTANT: This tracks when a device first joins
    $deviceStmt = $db->prepare("
        INSERT INTO sync_devices (device_id, sync_id, device_name, created_at, last_seen)
        VALUES (?, ?, 'Web Browser', NOW(), NOW())
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $deviceStmt->execute([$device_id, $sync_id]);

    // Try to log metric but don't fail if table doesn't exist
    try {
        $metric = $db->prepare("INSERT INTO sync_metrics (event, metadata) VALUES (?, ?)");
        $metric->execute(['sync_pull', json_encode([
            'sync_id' => $sync_id,
            'device_id' => $device_id
        ])]);
    } catch (Exception $e) {
        // Ignore metrics errors
    }

    // Return success response
    echo json_encode([
        'encrypted_blob' => $result['encrypted_blob'],
        'version' => $result['version'],
        'last_modified' => $result['updated_at']
    ]);

} catch (Exception $e) {
    error_log("Pull error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Pull failed: ' . $e->getMessage()]);
}
