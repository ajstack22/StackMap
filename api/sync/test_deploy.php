<?php
// Simple test to verify API deployment
echo json_encode([
    'status' => 'API is deployed and accessible',
    'timestamp' => date('Y-m-d H:i:s'),
    'files' => [
        'access_share.php' => file_exists('access_share.php'),
        'create_share.php' => file_exists('create_share.php'),
        'update_share.php' => file_exists('update_share.php'),
        'database.php' => file_exists('database.php'),
        'config.php' => file_exists('config.php')
    ],
    'current_dir' => __DIR__,
    'server' => $_SERVER['HTTP_HOST'] ?? 'unknown'
]);
?>