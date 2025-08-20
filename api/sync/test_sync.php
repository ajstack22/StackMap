<?php
// Test script for sync API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    echo json_encode(['status' => 'OPTIONS request handled']);
    exit(0);
}

$response = [
    'status' => 'ok',
    'method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'script_name' => $_SERVER['SCRIPT_NAME'],
    'config_exists' => file_exists('config.php'),
    'database_exists' => file_exists('database.php'),
    'php_version' => phpversion(),
    'post_data' => $_POST,
    'get_data' => $_GET,
    'raw_input' => file_get_contents('php://input')
];

// Test database connection if config exists
if (file_exists('config.php')) {
    try {
        require_once 'config.php';
        $response['config_loaded'] = true;
        $response['environment'] = defined('DB_NAME') ? 'Config loaded' : 'Config error';
    } catch (Exception $e) {
        $response['config_error'] = $e->getMessage();
    }
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>