<?php
header('Content-Type: text/plain');

echo "Share API Debug Info\n";
echo "===================\n\n";

// Show which environment we're in
echo "Environment Info:\n";
echo "Script Path: " . __FILE__ . "\n";
echo "Server Name: " . $_SERVER['SERVER_NAME'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// Check config
if (file_exists('config.php')) {
    require_once 'config.php';
    echo "Database Config:\n";
    echo "DB_NAME: " . DB_NAME . "\n";
    echo "DB_USER: " . DB_USER . "\n";
    echo "DB_HOST: " . DB_HOST . "\n\n";
    
    // Check if this is qual or prod based on DB name
    if (strpos(DB_NAME, 'qual') !== false) {
        echo "✓ Using QUAL database\n";
    } else {
        echo "⚠️ Using PRODUCTION database\n";
    }
} else {
    echo "✗ config.php not found!\n";
}

echo "\n\nTo test share creation:\n";
echo "1. Create a share from the app\n";
echo "2. Check this URL again to see if shares appear in the database\n";
echo "3. Visit: " . dirname($_SERVER['REQUEST_URI']) . "/check_share.php\n";
?>