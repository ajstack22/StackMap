<?php
/**
 * Run migration to create sync_invites table
 * This file should be deleted after running!
 */

header('Content-Type: text/plain');

// Security check - only allow from command line or specific request
$secret = $_GET['secret'] ?? '';
if ($secret !== 'temp_migration_2025') {
    die("Unauthorized\n");
}

require_once 'config.php';
require_once 'database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Starting migration for sync_invites table...\n";
    
    // Read the migration file
    $migrationFile = __DIR__ . '/migrations/create_sync_invites_table.sql';
    if (!file_exists($migrationFile)) {
        die("Migration file not found: $migrationFile\n");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolon but ignore comments
    $statements = [];
    $currentStatement = '';
    $lines = explode("\n", $sql);
    
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '--') === 0) {
            continue;
        }
        
        $currentStatement .= $line . ' ';
        
        // If line ends with semicolon, we have a complete statement
        if (substr($line, -1) === ';') {
            $statements[] = trim($currentStatement);
            $currentStatement = '';
        }
    }
    
    // Execute each statement
    $successCount = 0;
    foreach ($statements as $stmt) {
        if (empty($stmt)) continue;
        
        try {
            $db->exec($stmt);
            echo "✅ Executed: " . substr($stmt, 0, 60) . "...\n";
            $successCount++;
        } catch (PDOException $e) {
            // Check if it's a "table already exists" error
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "⚠️  Table/view already exists (skipping): " . substr($stmt, 0, 40) . "...\n";
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                echo "   Statement: " . substr($stmt, 0, 100) . "...\n";
            }
        }
    }
    
    echo "\n✅ Migration complete! Executed $successCount statements.\n";
    
    // Verify the table was created
    $checkStmt = $db->query("SHOW TABLES LIKE 'sync_invites'");
    if ($checkStmt->fetch()) {
        echo "✅ Verified: sync_invites table exists\n";
        
        // Show table structure
        echo "\nTable structure:\n";
        $descStmt = $db->query("DESCRIBE sync_invites");
        while ($row = $descStmt->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$row['Field']} ({$row['Type']})\n";
        }
    } else {
        echo "⚠️  Warning: sync_invites table not found after migration\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n⚠️  IMPORTANT: Delete this file after running!\n";
?>