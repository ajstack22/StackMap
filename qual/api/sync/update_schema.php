<?php
// TEMPORARY SCRIPT - DELETE AFTER RUNNING!
require_once 'config.php';
require_once 'database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Add share_version column if it doesn't exist
    $sql = "ALTER TABLE share_links 
            ADD COLUMN IF NOT EXISTS share_version INT DEFAULT 1 AFTER created_by_device";
    
    $db->exec($sql);
    echo "Added share_version column successfully.\n";
    
    // Add auto_update column if it doesn't exist
    $sql = "ALTER TABLE share_links
            ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT FALSE AFTER share_version";
    
    $db->exec($sql);
    echo "Added auto_update column successfully.\n";
    
    // Create indexes
    $sql = "CREATE INDEX IF NOT EXISTS idx_version ON share_links(share_version)";
    $db->exec($sql);
    echo "Created version index successfully.\n";
    
    $sql = "CREATE INDEX IF NOT EXISTS idx_auto_update ON share_links(user_id, auto_update, expires_at)";
    $db->exec($sql);
    echo "Created auto_update index successfully.\n";
    
    // Show current table structure
    $stmt = $db->query("DESCRIBE share_links");
    echo "\nCurrent table structure:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . " - " . $row['Type'] . "\n";
    }
    
    echo "\nSchema update completed successfully!\n";
    echo "\n⚠️  IMPORTANT: Delete this file after running!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>