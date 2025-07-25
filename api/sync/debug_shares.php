<?php
/**
 * Debug script to check share data and versions
 */

header('Content-Type: text/plain');

require_once 'config.php';
require_once 'database.php';

echo "Share Debug Information\n";
echo "======================\n\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Check all shares
    echo "All shares in database:\n";
    $stmt = $db->query("
        SELECT 
            share_id,
            access_token,
            user_id,
            auto_update,
            share_version,
            created_at,
            expires_at,
            LENGTH(access_token) as token_length
        FROM share_links 
        ORDER BY created_at DESC
        LIMIT 10
    ");
    
    $shares = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($shares as $share) {
        echo "\nShare ID: {$share['share_id']}\n";
        echo "  Token: " . substr($share['access_token'], 0, 8) . "... (length: {$share['token_length']})\n";
        echo "  Version: " . ($share['share_version'] ?? 'NULL') . "\n";
        echo "  Auto-update: " . ($share['auto_update'] ? 'YES' : 'NO') . "\n";
        echo "  Token type: " . ($share['token_length'] > 8 ? 'V2 (encrypted)' : 'V1 (legacy)') . "\n";
        echo "  Created: {$share['created_at']}\n";
        echo "  Expires: {$share['expires_at']}\n";
    }
    
    // Check column info
    echo "\n\nTable structure for access_token column:\n";
    $stmt = $db->query("DESCRIBE share_links");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (in_array($row['Field'], ['access_token', 'auto_update', 'share_version', 'last_updated_at'])) {
            echo "{$row['Field']}: Type={$row['Type']}, Default={$row['Default']}, Null={$row['Null']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>