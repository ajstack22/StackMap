<?php
// Test database connection and tables
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once 'config.php';
    require_once 'database.php';
    
    $db = Database::getInstance()->getConnection();
    
    // Test tables exist
    $tables = [];
    
    // Check sync_groups
    try {
        $result = $db->query("SELECT COUNT(*) FROM sync_groups");
        $tables['sync_groups'] = 'exists';
    } catch (Exception $e) {
        $tables['sync_groups'] = 'missing: ' . $e->getMessage();
    }
    
    // Check sync_devices
    try {
        $result = $db->query("SELECT COUNT(*) FROM sync_devices");
        $tables['sync_devices'] = 'exists';
    } catch (Exception $e) {
        $tables['sync_devices'] = 'missing: ' . $e->getMessage();
    }
    
    // Check sync_records
    try {
        $result = $db->query("SELECT COUNT(*) FROM sync_records");
        $tables['sync_records'] = 'exists';
    } catch (Exception $e) {
        $tables['sync_records'] = 'missing: ' . $e->getMessage();
    }
    
    echo json_encode([
        'success' => true,
        'db_connected' => true,
        'tables' => $tables,
        'db_host' => DB_HOST,
        'db_name' => DB_NAME
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>