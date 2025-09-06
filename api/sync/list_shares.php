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

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get device_id from query parameters
$device_id = $_GET['device_id'] ?? null;

if (!$device_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing device_id']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all active shares for this device
    // Remove expired shares automatically
    $stmt = $db->prepare("
        SELECT 
            share_id,
            recipient_name,
            share_note,
            expires_at,
            created_at,
            access_count,
            CASE 
                WHEN expires_at < NOW() THEN 'expired'
                ELSE 'active'
            END as status
        FROM shares 
        WHERE device_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    ");
    
    $stmt->execute([$device_id]);
    $shares = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Separate active and expired shares
    $active_shares = [];
    $expired_shares = [];
    
    foreach ($shares as $share) {
        if ($share['status'] === 'expired') {
            $expired_shares[] = $share;
        } else {
            $active_shares[] = $share;
        }
    }
    
    // Clean up old expired shares (older than 30 days)
    $cleanupStmt = $db->prepare("
        DELETE FROM shares 
        WHERE device_id = ? 
        AND expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $cleanupStmt->execute([$device_id]);
    
    echo json_encode([
        'success' => true,
        'active_shares' => $active_shares,
        'expired_shares' => $expired_shares,
        'cleaned_up' => $cleanupStmt->rowCount()
    ]);
    
} catch (Exception $e) {
    error_log("List shares error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to list shares']);
}
?>