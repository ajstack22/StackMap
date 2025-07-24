<?php
header('Content-Type: application/json');

// Test 1: Basic PHP
echo "Test 1: PHP is working\n";

// Test 2: Check if config.php exists
if (file_exists('config.php')) {
    echo "Test 2: config.php exists\n";
} else {
    echo "Test 2: ERROR - config.php NOT FOUND\n";
}

// Test 3: Try to include config.php
try {
    require_once 'config.php';
    echo "Test 3: config.php loaded successfully\n";
    echo "Test 3a: DB_HOST = " . (defined('DB_HOST') ? 'defined' : 'NOT defined') . "\n";
    echo "Test 3b: DB_NAME = " . (defined('DB_NAME') ? 'defined' : 'NOT defined') . "\n";
} catch (Exception $e) {
    echo "Test 3: ERROR loading config.php: " . $e->getMessage() . "\n";
}

// Test 4: Check database.php
if (file_exists('database.php')) {
    echo "Test 4: database.php exists\n";
} else {
    echo "Test 4: ERROR - database.php NOT FOUND\n";
}

// Test 5: Try database connection
try {
    require_once 'database.php';
    $db = Database::getInstance()->getConnection();
    echo "Test 5: Database connection successful\n";
} catch (Exception $e) {
    echo "Test 5: ERROR with database: " . $e->getMessage() . "\n";
}

// Test 6: Check other required files
$files = ['create_share.php', 'access_share.php', 'share_schema.sql'];
foreach ($files as $file) {
    echo "Test 6: $file " . (file_exists($file) ? 'exists' : 'NOT FOUND') . "\n";
}

// Test 7: Current directory
echo "Test 7: Current directory: " . getcwd() . "\n";
echo "Test 8: Script directory: " . __DIR__ . "\n";
?>