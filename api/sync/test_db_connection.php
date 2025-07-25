<?php
// Test database connection
header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing database connection...\n\n";

// Test 1: Check if config.php exists and is readable
echo "1. Checking config.php:\n";
if (file_exists('config.php')) {
    echo "   - config.php exists\n";
    if (is_readable('config.php')) {
        echo "   - config.php is readable\n";
        
        // Try to include it
        try {
            require_once 'config.php';
            echo "   - config.php included successfully\n";
            echo "   - DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'NOT DEFINED') . "\n";
            echo "   - DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'NOT DEFINED') . "\n";
            echo "   - DB_USER: " . (defined('DB_USER') ? DB_USER : 'NOT DEFINED') . "\n";
            echo "   - DB_PASS: " . (defined('DB_PASS') ? '***' : 'NOT DEFINED') . "\n";
        } catch (Exception $e) {
            echo "   - ERROR including config.php: " . $e->getMessage() . "\n";
        }
    } else {
        echo "   - ERROR: config.php is not readable\n";
    }
} else {
    echo "   - ERROR: config.php does not exist\n";
}

// Test 2: Check if database.php exists
echo "\n2. Checking database.php:\n";
if (file_exists('database.php')) {
    echo "   - database.php exists\n";
    try {
        require_once 'database.php';
        echo "   - database.php included successfully\n";
    } catch (Exception $e) {
        echo "   - ERROR including database.php: " . $e->getMessage() . "\n";
    }
} else {
    echo "   - ERROR: database.php does not exist\n";
}

// Test 3: Try to connect to database
echo "\n3. Testing database connection:\n";
if (class_exists('Database')) {
    try {
        $db = Database::getInstance()->getConnection();
        echo "   - Database connection successful!\n";
        
        // Test 4: Check if share_links table exists
        echo "\n4. Checking share_links table:\n";
        $stmt = $db->query("SHOW TABLES LIKE 'share_links'");
        if ($stmt->rowCount() > 0) {
            echo "   - share_links table exists\n";
            
            // Check table structure
            $stmt = $db->query("DESCRIBE share_links");
            echo "   - Table columns:\n";
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo "     - " . $row['Field'] . " (" . $row['Type'] . ")\n";
            }
        } else {
            echo "   - ERROR: share_links table does not exist\n";
            echo "   - You need to run the SQL from share_schema_v2.sql\n";
        }
    } catch (PDOException $e) {
        echo "   - ERROR connecting to database: " . $e->getMessage() . "\n";
    } catch (Exception $e) {
        echo "   - ERROR: " . $e->getMessage() . "\n";
    }
} else {
    echo "   - ERROR: Database class not found\n";
}

// Test 5: Check PHP version and extensions
echo "\n5. PHP Environment:\n";
echo "   - PHP Version: " . phpversion() . "\n";
echo "   - PDO extension: " . (extension_loaded('pdo') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "   - PDO MySQL: " . (extension_loaded('pdo_mysql') ? 'Loaded' : 'NOT LOADED') . "\n";

echo "\nDone.\n";
?>