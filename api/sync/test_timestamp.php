<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Test database connection
    require_once 'database.php';
    $conn = getConnection();
    
    // Check if tables exist
    $tables = [];
    $result = $conn->query("SHOW TABLES LIKE 'sync_%'");
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    
    // Try to create tables if they don't exist
    $tables_needed = ['sync_records', 'sync_groups', 'sync_devices'];
    $missing = array_diff($tables_needed, $tables);
    
    if (!empty($missing)) {
        // Read and execute schema
        $schema = file_get_contents('schema_timestamp.sql');
        if ($schema) {
            // Split by semicolon and execute each statement
            $statements = array_filter(explode(';', $schema));
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (!empty($statement)) {
                    $conn->query($statement);
                }
            }
            
            // Check again
            $result = $conn->query("SHOW TABLES LIKE 'sync_%'");
            $tables = [];
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'tables' => $tables,
        'missing' => $missing,
        'php_version' => PHP_VERSION,
        'mysqli' => class_exists('mysqli'),
        'server_time' => round(microtime(true) * 1000)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Test failed',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>