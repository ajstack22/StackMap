<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';
require_once 'database.php';

// Get sync_id from query parameter
$sync_id = $_GET['sync_id'] ?? '';

if (!$sync_id) {
    echo json_encode(['error' => 'No sync_id provided']);
    exit();
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if sync exists
    $stmt = $db->prepare("SELECT sync_id, created_at, updated_at FROM sync_data WHERE sync_id = ?");
    $stmt->execute([$sync_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo json_encode([
            'exists' => true,
            'sync_id' => $result['sync_id'],
            'created_at' => $result['created_at'],
            'updated_at' => $result['updated_at']
        ]);
    } else {
        echo json_encode([
            'exists' => false,
            'sync_id' => $sync_id
        ]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>