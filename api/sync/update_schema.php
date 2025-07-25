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
    
    // Create index
    $sql = "CREATE INDEX IF NOT EXISTS idx_version ON share_links(share_version)";
    $db->exec($sql);
    echo "Created index successfully.\n";
    
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