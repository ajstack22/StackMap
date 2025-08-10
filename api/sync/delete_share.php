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

if (!$input || !isset($input['share_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing share_id']);
    exit;
}

$share_id = $input['share_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    // Delete the specific share from share_links table
    $deleteStmt = $db->prepare("DELETE FROM share_links WHERE share_id = ?");
    $result = $deleteStmt->execute([$share_id]);
    
    if ($deleteStmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Share deleted successfully'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Share not found or already deleted'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Delete share error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete share']);
}
?>