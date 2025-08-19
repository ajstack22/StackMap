<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Show the last modified time of create.php
$file = __DIR__ . '/create.php';
$lastModified = filemtime($file);

// Read first 100 lines of create.php to see if debug code is there
$lines = file($file);
$hasDebugCode = false;
foreach ($lines as $line) {
    if (strpos($line, 'existing_created_at') !== false) {
        $hasDebugCode = true;
        break;
    }
}

echo json_encode([
    'file' => 'create.php',
    'last_modified' => date('Y-m-d H:i:s', $lastModified),
    'has_debug_code' => $hasDebugCode,
    'php_version' => PHP_VERSION,
    'current_time' => date('Y-m-d H:i:s')
]);
?>