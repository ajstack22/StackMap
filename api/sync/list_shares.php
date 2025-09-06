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

// Get sync_id from query parameters (shares are tied to sync_id, not device_id)
$sync_id = $_GET['sync_id'] ?? null;

if (!$sync_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing sync_id']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all active shares for this sync_id from share_links table
    // Remove expired shares automatically
    $stmt = $db->prepare("
        SELECT 
            share_id,
            recipient_name,
            share_note,
            expires_at,
            created_at,
            auto_update,
            CASE 
                WHEN expires_at < NOW() THEN 'expired'
                ELSE 'active'
            END as status
        FROM share_links 
        WHERE sync_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    ");
    
    $stmt->execute([$sync_id]);
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
        DELETE FROM share_links 
        WHERE sync_id = ? 
        AND expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $cleanupStmt->execute([$sync_id]);
    
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