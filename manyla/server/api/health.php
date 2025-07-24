<?php
/**
 * StackMap Sync - Health Check Endpoint
 * 
 * Simple endpoint to check if the sync service is reachable.
 * Used by the network monitor to test connectivity.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Return health status
echo json_encode([
    'status' => 'healthy',
    'service' => 'stackmap-sync',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => '1.0.0'
]);
?>