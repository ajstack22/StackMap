<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'database.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['sync_id']) || !isset($input['device_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$sync_id = $input['sync_id'];
$device_id = $input['device_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    // First verify that this sync_id exists in any of the sync tables
    $checkStmt = $db->prepare("
        SELECT 1 FROM sync_groups WHERE sync_id = ? 
        UNION 
        SELECT 1 FROM sync_data WHERE sync_id = ? 
        LIMIT 1
    ");
    $checkStmt->execute([$sync_id, $sync_id]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Sync data not found']);
        exit;
    }
    
    // Delete from all related tables
    // Delete shares
    $deleteSharesStmt = $db->prepare("DELETE FROM shares WHERE sync_id = ?");
    $deleteSharesStmt->execute([$sync_id]);
    
    // Delete invites
    $deleteInvitesStmt = $db->prepare("DELETE FROM sync_invites WHERE sync_id = ?");
    $deleteInvitesStmt->execute([$sync_id]);
    
    // Delete sync records
    $deleteRecordsStmt = $db->prepare("DELETE FROM sync_records WHERE sync_id = ?");
    $deleteRecordsStmt->execute([$sync_id]);
    
    // Delete devices
    $deleteDevicesStmt = $db->prepare("DELETE FROM sync_devices WHERE sync_id = ?");
    $deleteDevicesStmt->execute([$sync_id]);
    
    // Delete from sync_groups
    $deleteGroupsStmt = $db->prepare("DELETE FROM sync_groups WHERE sync_id = ?");
    $deleteGroupsStmt->execute([$sync_id]);
    
    // Delete from sync_data (if exists)
    $deleteSyncStmt = $db->prepare("DELETE FROM sync_data WHERE sync_id = ?");
    $deleteSyncStmt->execute([$sync_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'All sync data deleted successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Delete sync error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete sync data']);
}
?>