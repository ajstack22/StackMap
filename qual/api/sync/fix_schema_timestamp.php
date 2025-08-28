<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Starting schema fix...\n";
    
    // Drop the incorrect foreign key constraint if it exists
    try {
        $db->exec("ALTER TABLE sync_devices DROP FOREIGN KEY sync_devices_ibfk_1");
        echo "Dropped old foreign key constraint\n";
    } catch (Exception $e) {
        echo "Old foreign key doesn't exist or already dropped\n";
    }
    
    // Check if sync_groups table exists
    $check = $db->query("SHOW TABLES LIKE 'sync_groups'");
    if ($check->rowCount() === 0) {
        // Create sync_groups table
        $db->exec("
            CREATE TABLE IF NOT EXISTS sync_groups (
                sync_id VARCHAR(64) PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                device_count INT DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "Created sync_groups table\n";
    } else {
        echo "sync_groups table already exists\n";
    }
    
    // Check if sync_records table exists
    $check = $db->query("SHOW TABLES LIKE 'sync_records'");
    if ($check->rowCount() === 0) {
        // Create sync_records table
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
        echo "Created sync_records table\n";
    } else {
        echo "sync_records table already exists\n";
    }
    
    // Drop and recreate sync_devices table with correct foreign key
    try {
        // First, backup any existing data
        $backup = $db->query("SELECT * FROM sync_devices");
        $backupData = $backup->fetchAll(PDO::FETCH_ASSOC);
        
        // Drop the table
        $db->exec("DROP TABLE IF EXISTS sync_devices");
        echo "Dropped old sync_devices table\n";
        
        // Recreate with correct foreign key
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
        echo "Created new sync_devices table with correct foreign key\n";
        
        // Restore data if any existed (only for sync_ids that exist in sync_groups)
        if (count($backupData) > 0) {
            foreach ($backupData as $row) {
                // Check if sync_id exists in sync_groups
                $check = $db->prepare("SELECT sync_id FROM sync_groups WHERE sync_id = ?");
                $check->execute([$row['sync_id']]);
                if ($check->fetch()) {
                    $restore = $db->prepare("
                        INSERT INTO sync_devices (sync_id, device_id, first_seen, last_seen, push_count)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $restore->execute([
                        $row['sync_id'],
                        $row['device_id'],
                        $row['first_seen'],
                        $row['last_seen'],
                        $row['push_count'] ?? 0
                    ]);
                    echo "Restored device: {$row['device_id']} for sync: {$row['sync_id']}\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "Error recreating sync_devices: " . $e->getMessage() . "\n";
    }
    
    // Migrate any existing sync_data records to sync_groups if needed
    try {
        $check = $db->query("SHOW TABLES LIKE 'sync_data'");
        if ($check->rowCount() > 0) {
            $migrate = $db->query("
                INSERT IGNORE INTO sync_groups (sync_id, created_at)
                SELECT sync_id, created_at FROM sync_data
            ");
            $count = $migrate->rowCount();
            if ($count > 0) {
                echo "Migrated $count sync groups from sync_data to sync_groups\n";
            }
        }
    } catch (Exception $e) {
        echo "Migration note: " . $e->getMessage() . "\n";
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Schema fixed successfully'
    ]);
    
} catch (Exception $e) {
    error_log('Schema fix error: ' . $e->getMessage());
    echo json_encode([
        'error' => 'Failed to fix schema',
        'message' => $e->getMessage()
    ]);
}
?>