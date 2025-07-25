<?php
// Simple endpoint test
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'success',
    'message' => 'API endpoint is working',
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query_params' => $_GET,
    'php_version' => phpversion()
]);
?>