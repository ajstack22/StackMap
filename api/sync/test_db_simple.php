<?php
// Simple database connection test
require_once 'config.php';

header('Content-Type: text/plain');

echo "Database Connection Test\n";
echo "=======================\n\n";

echo "Config values:\n";
echo "DB_HOST: " . DB_HOST . "\n";
echo "DB_NAME: " . DB_NAME . "\n";
echo "DB_USER: " . DB_USER . "\n";
echo "DB_PASS: " . (defined('DB_PASS') ? '[DEFINED]' : '[NOT DEFINED]') . "\n\n";

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Database connection successful!\n\n";
    
    // Check if shares table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'shares'");
    if ($stmt->rowCount() > 0) {
        echo "✓ 'shares' table exists\n";
        
        // Get table structure
        $stmt = $pdo->query("DESCRIBE shares");
        echo "\nTable structure:\n";
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo sprintf("  %-20s %-20s %s\n", 
                $row['Field'], 
                $row['Type'], 
                $row['Null'] === 'YES' ? 'NULL' : 'NOT NULL'
            );
        }
    } else {
        echo "✗ 'shares' table does not exist\n";
        echo "\nTo create it, run the SQL from share_schema_v2.sql\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Database connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
}
?>