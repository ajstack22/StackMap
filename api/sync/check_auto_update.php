<?php
header('Content-Type: text/plain');

require_once 'config.php';
require_once 'database.php';

echo "Auto-Update Share Status Check\n";
echo "==============================\n\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Show all shares with auto_update status
    echo "All shares with auto_update status:\n\n";
    $stmt = $db->query("
        SELECT 
            share_id,
            access_token,
            user_id,
            auto_update,
            share_version,
            created_at,
            expires_at
        FROM share_links 
        ORDER BY created_at DESC
    ");
    
    $shares = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($shares)) {
        echo "No shares found in database\n";
    } else {
        $autoUpdateCount = 0;
        foreach ($shares as $share) {
            $autoUpdate = $share['auto_update'] ? 'YES' : 'NO';
            if ($share['auto_update']) $autoUpdateCount++;
            
            echo "Share ID: {$share['share_id']}\n";
            echo "  Token: " . substr($share['access_token'], 0, 8) . "...\n";
            echo "  User: {$share['user_id']}\n";
            echo "  Auto-Update: $autoUpdate\n";
            echo "  Version: {$share['share_version']}\n";
            echo "  Created: {$share['created_at']}\n";
            echo "  Expires: {$share['expires_at']}\n";
            echo "\n";
        }
        
        echo "Summary:\n";
        echo "- Total shares: " . count($shares) . "\n";
        echo "- Auto-update enabled: $autoUpdateCount\n";
        echo "- Auto-update disabled: " . (count($shares) - $autoUpdateCount) . "\n";
    }
    
    // Check if create_share.php is properly setting auto_update
    echo "\n\nChecking share_links table structure:\n";
    $stmt = $db->query("DESCRIBE share_links");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['Field'] === 'auto_update') {
            echo "auto_update column: Type={$row['Type']}, Default={$row['Default']}, Null={$row['Null']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>