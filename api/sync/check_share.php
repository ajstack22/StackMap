<?php
header('Content-Type: text/plain');

require_once 'config.php';
require_once 'database.php';

echo "Share Link Database Check\n";
echo "=========================\n\n";

$token = $_GET['token'] ?? '';
echo "Token provided: " . ($token ?: '[none]') . "\n";
echo "Token length: " . strlen($token) . "\n\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Count total shares
    $stmt = $db->query("SELECT COUNT(*) as count FROM share_links");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Total shares in database: $count\n\n";
    
    // Show recent shares
    echo "Recent shares (last 5):\n";
    $stmt = $db->query("SELECT share_id, access_token, created_at, expires_at, share_version FROM share_links ORDER BY created_at DESC LIMIT 5");
    $shares = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($shares)) {
        echo "No shares found in database\n";
    } else {
        foreach ($shares as $share) {
            echo "- Share ID: {$share['share_id']}\n";
            echo "  Token: {$share['access_token']}\n";
            echo "  Created: {$share['created_at']}\n";
            echo "  Expires: {$share['expires_at']}\n";
            echo "  Version: {$share['share_version']}\n\n";
        }
    }
    
    // Check for specific token if provided
    if ($token) {
        echo "\nChecking for specific token:\n";
        $stmt = $db->prepare("SELECT * FROM share_links WHERE access_token = ?");
        $stmt->execute([$token]);
        $share = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($share) {
            echo "✓ Token found in database!\n";
            echo "Share ID: {$share['share_id']}\n";
            echo "Created: {$share['created_at']}\n";
            echo "Expires: {$share['expires_at']}\n";
        } else {
            echo "✗ Token not found in database\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>