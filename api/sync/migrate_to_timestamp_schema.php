<?php
/**
 * Database Migration Script for StackMap Timestamp-based Sync
 * 
 * This script must be run by a database administrator with DROP and CREATE privileges.
 * It migrates from the mixed schema to a clean timestamp-based schema.
 * 
 * IMPORTANT: Back up your database before running this script!
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

// Security check - this should only be run manually by an admin
if (!isset($_GET['confirm']) || $_GET['confirm'] !== 'migrate_timestamp_schema') {
    die("This migration script requires confirmation parameter: ?confirm=migrate_timestamp_schema\n");
}

require_once 'database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Starting migration to clean timestamp schema...\n\n";
    
    // Step 1: Create new tables if they don't exist
    echo "Step 1: Creating timestamp schema tables...\n";
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS sync_groups (
            sync_id VARCHAR(64) PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            device_count INT DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ sync_groups table ready\n";
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS sync_records (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            sync_id VARCHAR(64) NOT NULL,
            device_id VARCHAR(64) NOT NULL,
            client_timestamp BIGINT NOT NULL,
            server_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
            encrypted_blob LONGTEXT NOT NULL,
            
            INDEX idx_sync_device (sync_id, device_id),
            INDEX idx_sync_timestamp (sync_id, client_timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ sync_records table ready\n";
    
    // Step 2: Migrate data from sync_data to sync_groups if needed
    echo "\nStep 2: Migrating existing sync groups...\n";
    $check = $db->query("SHOW TABLES LIKE 'sync_data'");
    if ($check->rowCount() > 0) {
        $count = $db->exec("
            INSERT IGNORE INTO sync_groups (sync_id, created_at)
            SELECT sync_id, created_at FROM sync_data
        ");
        echo "  ✓ Migrated $count sync groups from sync_data\n";
    } else {
        echo "  ℹ No sync_data table found, skipping migration\n";
    }
    
    // Step 3: Drop and recreate sync_devices with correct foreign key
    echo "\nStep 3: Recreating sync_devices table with correct foreign key...\n";
    
    // First, try to backup existing data
    $backup_data = [];
    try {
        $backup = $db->query("SELECT * FROM sync_devices");
        $backup_data = $backup->fetchAll(PDO::FETCH_ASSOC);
        echo "  ✓ Backed up " . count($backup_data) . " device records\n";
    } catch (Exception $e) {
        echo "  ℹ No existing sync_devices data to backup\n";
    }
    
    // Drop the old table
    try {
        $db->exec("DROP TABLE IF EXISTS sync_devices");
        echo "  ✓ Dropped old sync_devices table\n";
    } catch (Exception $e) {
        echo "  ⚠ Could not drop sync_devices table: " . $e->getMessage() . "\n";
        echo "  ! You may need to manually drop this table and re-run the migration\n";
        exit(1);
    }
    
    // Create new sync_devices table with correct foreign key to sync_groups
    $db->exec("
        CREATE TABLE sync_devices (
            sync_id VARCHAR(64) NOT NULL,
            device_id VARCHAR(64) NOT NULL,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            push_count INT DEFAULT 0,
            
            PRIMARY KEY (sync_id, device_id),
            FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Created new sync_devices table with correct foreign key\n";
    
    // Restore backed up data (only for sync_ids that exist in sync_groups)
    if (count($backup_data) > 0) {
        $restored = 0;
        $stmt = $db->prepare("
            INSERT INTO sync_devices (sync_id, device_id, first_seen, last_seen, push_count)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($backup_data as $row) {
            // Check if sync_id exists in sync_groups
            $check = $db->prepare("SELECT 1 FROM sync_groups WHERE sync_id = ?");
            $check->execute([$row['sync_id']]);
            if ($check->fetch()) {
                $stmt->execute([
                    $row['sync_id'],
                    $row['device_id'],
                    $row['first_seen'] ?? null,
                    $row['last_seen'] ?? null,
                    $row['push_count'] ?? 0
                ]);
                $restored++;
            }
        }
        echo "  ✓ Restored $restored device records\n";
    }
    
    // Step 4: Clean up old tables (optional)
    echo "\nStep 4: Cleanup recommendations...\n";
    echo "  ℹ The following tables can be dropped if no longer needed:\n";
    echo "    - sync_data (old sync table)\n";
    echo "    - shares (if using old sharing system)\n";
    echo "    - share_access (if using old sharing system)\n";
    echo "  Run these commands manually if you want to remove them:\n";
    echo "    DROP TABLE IF EXISTS sync_data;\n";
    echo "    DROP TABLE IF EXISTS shares;\n";
    echo "    DROP TABLE IF EXISTS share_access;\n";
    
    // Step 5: Verify the migration
    echo "\nStep 5: Verifying migration...\n";
    
    // Check tables exist
    $tables = ['sync_groups', 'sync_records', 'sync_devices'];
    $all_good = true;
    foreach ($tables as $table) {
        $check = $db->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() > 0) {
            echo "  ✓ $table exists\n";
        } else {
            echo "  ✗ $table missing!\n";
            $all_good = false;
        }
    }
    
    // Check foreign key
    $fk_check = $db->query("
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'sync_devices' 
        AND REFERENCED_TABLE_NAME = 'sync_groups'
    ");
    if ($fk_check->rowCount() > 0) {
        echo "  ✓ Foreign key correctly references sync_groups\n";
    } else {
        echo "  ✗ Foreign key not found or incorrect!\n";
        $all_good = false;
    }
    
    if ($all_good) {
        echo "\n✅ Migration completed successfully!\n";
        echo "The database is now using the clean timestamp-based schema.\n";
    } else {
        echo "\n⚠ Migration completed with issues. Please review the errors above.\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    echo "Please fix the issue and try again.\n";
    exit(1);
}
?>