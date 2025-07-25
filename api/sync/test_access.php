<?php
// Test access_share.php functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing access_share.php endpoint...\n\n";

// Check file permissions
$files = ['access_share.php', 'config.php', 'database.php'];
echo "File permissions:\n";
foreach ($files as $file) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        echo "$file: " . substr(sprintf('%o', $perms), -4) . " ";
        echo (is_readable($file) ? "readable " : "NOT readable ");
        echo (is_executable($file) ? "executable" : "not executable") . "\n";
    } else {
        echo "$file: NOT FOUND\n";
    }
}

echo "\n\nTesting token validation regex:\n";
$testTokens = [
    'ABCDEF',     // v1 token
    'LSsHr9WntsKLkJYpbMXSlidB_-UrmAVUXq8wfppTmnY', // v2 token
];

foreach ($testTokens as $token) {
    $v1Match = preg_match('/^[A-Z0-9]{6,8}$/', $token);
    $v2Match = preg_match('/^[A-Za-z0-9_-]{24,}$/', $token);
    echo "Token: $token\n";
    echo "  V1 match: " . ($v1Match ? "YES" : "NO") . "\n";
    echo "  V2 match: " . ($v2Match ? "YES" : "NO") . "\n";
    echo "  Valid: " . ($v1Match || $v2Match ? "YES" : "NO") . "\n\n";
}

// Try to include the files
echo "Testing includes:\n";
if (file_exists('config.php')) {
    include_once 'config.php';
    echo "config.php included successfully\n";
} else {
    echo "config.php NOT FOUND\n";
}

if (file_exists('database.php')) {
    include_once 'database.php';
    echo "database.php included successfully\n";
} else {
    echo "database.php NOT FOUND\n";
}

echo "\nDone.";
?>