<?php
// Debug wrapper for access_share.php
header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start output buffering to catch any errors
ob_start();

try {
    // Check if access_share.php exists
    if (!file_exists('access_share.php')) {
        throw new Exception('access_share.php not found in ' . __DIR__);
    }
    
    // Check if we can read it
    if (!is_readable('access_share.php')) {
        throw new Exception('access_share.php is not readable');
    }
    
    // Check file size
    $fileSize = filesize('access_share.php');
    if ($fileSize === 0) {
        throw new Exception('access_share.php is empty');
    }
    
    // Try to include it
    $includeResult = include 'access_share.php';
    
    // If we get here without output, something's wrong
    $output = ob_get_contents();
    if (empty($output)) {
        throw new Exception('access_share.php produced no output. Include result: ' . var_export($includeResult, true));
    }
    
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(200); // Force 200 so we can see the error
    echo json_encode([
        'error' => 'Debug error: ' . $e->getMessage(),
        'file_exists' => file_exists('access_share.php'),
        'is_readable' => is_readable('access_share.php'),
        'file_size' => file_exists('access_share.php') ? filesize('access_share.php') : 0,
        'current_dir' => __DIR__,
        'php_errors' => error_get_last()
    ]);
    exit;
}

// Let the output through
ob_end_flush();
?>