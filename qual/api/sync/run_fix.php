<?php
/**
 * One-click database fix script
 * Access this via: https://stackmap.app/qual/api/sync/run_fix.php?confirm=fix
 */

header('Content-Type: text/plain');

// Security check
if (!isset($_GET['confirm']) || $_GET['confirm'] !== 'fix') {
    die("Access this script with: ?confirm=fix\n");
}

require_once 'database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Starting database fix...\n\n";
    
    // Step 1: Drop incorrect foreign key
    try {
        $db->exec("ALTER TABLE sync_devices DROP FOREIGN KEY sync_devices_ibfk_1");
        echo "✓ Dropped old foreign key constraint\n";
    } catch (Exception $e) {
        echo "ℹ Old foreign key already dropped or doesn't exist\n";
    }
    
    // Step 2: Add correct foreign key
    try {
        $db->exec("
            ALTER TABLE sync_devices 
            ADD CONSTRAINT sync_devices_ibfk_1 
            FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) 
            ON DELETE CASCADE
        ");
        echo "✓ Added correct foreign key to sync_groups\n";
    } catch (Exception $e) {
        echo "✗ Could not add foreign key: " . $e->getMessage() . "\n";
    }
    
    // Step 3: Fix columns
    try {
        $db->exec("ALTER TABLE sync_devices MODIFY COLUMN first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        echo "✓ Fixed first_seen column\n";
    } catch (Exception $e) {
        echo "ℹ first_seen column: " . $e->getMessage() . "\n";
    }
    
    try {
        $db->exec("ALTER TABLE sync_devices MODIFY COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        echo "✓ Fixed last_seen column\n";
    } catch (Exception $e) {
        echo "ℹ last_seen column: " . $e->getMessage() . "\n";
    }
    
    try {
        $db->exec("ALTER TABLE sync_devices MODIFY COLUMN push_count INT DEFAULT 0");
        echo "✓ Fixed push_count column\n";
    } catch (Exception $e) {
        echo "ℹ push_count column: " . $e->getMessage() . "\n";
    }
    
    // Step 4: Verify
    echo "\n--- Verification ---\n";
    
    $check = $db->query("
        SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'sync_devices'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    
    $constraints = $check->fetchAll(PDO::FETCH_ASSOC);
    foreach ($constraints as $constraint) {
        echo "Foreign key: {$constraint['CONSTRAINT_NAME']} -> {$constraint['REFERENCED_TABLE_NAME']}\n";
    }
    
    echo "\n✅ Database fix complete!\n";
    echo "You can now test sync at: https://stackmap.app/qual/\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}
?>