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
    
    // Delete the share
    $stmt = $db->prepare("DELETE FROM shares WHERE share_id = ?");
    $stmt->execute([$share_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Share deleted successfully'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'error' => 'Share not found'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Delete share error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete share']);
}
?>