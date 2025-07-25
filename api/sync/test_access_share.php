<?php
// Test wrapper for access_share.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Capture any output
ob_start();

// Store original GET parameters
$original_get = $_GET;

// Set test token if not provided
if (!isset($_GET['token'])) {
    $_GET['token'] = 'LSsHr9WntsKLkJYpbMXSlidB_-UrmAVUXq8wfppTmnY';
}

echo "Testing access_share.php with token: " . $_GET['token'] . "\n\n";

// Check file
if (!file_exists('access_share.php')) {
    die("ERROR: access_share.php not found!");
}

echo "File exists, attempting to include...\n\n";

// Try to include
try {
    // Capture errors
    $error_handler = function($errno, $errstr, $errfile, $errline) {
        echo "PHP Error [$errno]: $errstr\n";
        echo "File: $errfile\n";
        echo "Line: $errline\n\n";
        return true; // Don't execute default handler
    };
    
    set_error_handler($error_handler);
    
    // Include the file
    $result = include 'access_share.php';
    
    restore_error_handler();
    
    // Check what was output
    $output = ob_get_contents();
    ob_end_clean();
    
    // Display results
    header('Content-Type: text/plain');
    echo "=== OUTPUT FROM access_share.php ===\n";
    echo $output;
    echo "\n=== END OUTPUT ===\n";
    
    // Check HTTP response code
    $code = http_response_code();
    echo "\nHTTP Response Code: $code\n";
    
    // Try to decode JSON if present
    if (strpos($output, '{') !== false) {
        echo "\nAttempting to parse JSON...\n";
        $json_start = strpos($output, '{');
        $json_data = substr($output, $json_start);
        $decoded = json_decode($json_data, true);
        if ($decoded) {
            echo "JSON decoded successfully:\n";
            print_r($decoded);
        } else {
            echo "JSON decode failed: " . json_last_error_msg() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
} catch (ParseError $e) {
    echo "Parse Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

// Restore original GET
$_GET = $original_get;
?>