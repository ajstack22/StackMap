<?php
/**
 * Standardized JSON response utilities for the sync API
 * Ensures all responses are JSON formatted, even errors
 */

/**
 * Send a JSON response and exit
 * @param array $data The data to send
 * @param int $statusCode HTTP status code (default 200)
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    // Ensure we have a success flag
    if (!isset($data['success'])) {
        $data['success'] = ($statusCode >= 200 && $statusCode < 300);
    }
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Send a JSON error response and exit
 * @param string $message Error message
 * @param int $statusCode HTTP status code (default 400)
 * @param array $additionalData Additional data to include
 */
function sendError($message, $statusCode = 400, $additionalData = []) {
    $response = array_merge([
        'success' => false,
        'error' => $message,
        'message' => $message // For backward compatibility
    ], $additionalData);
    
    sendResponse($response, $statusCode);
}

/**
 * Get JSON input from request body
 * @return array|null Parsed JSON data or null if invalid
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return null;
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON in request body', 400, [
            'json_error' => json_last_error_msg()
        ]);
    }
    
    return $data;
}

/**
 * Set CORS headers for the API
 */
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Validate required fields in data
 * @param array $data The data to validate
 * @param array $required Array of required field names
 * @return bool True if valid, sends error and exits if not
 */
function validateRequired($data, $required) {
    if (!is_array($data)) {
        sendError('Invalid request data', 400);
    }
    
    $missing = [];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendError('Missing required fields', 400, [
            'missing_fields' => $missing,
            'required_fields' => $required
        ]);
    }
    
    return true;
}

/**
 * Handle database errors consistently
 * @param Exception $e The exception
 * @param string $operation The operation that failed
 */
function handleDatabaseError($e, $operation = 'Database operation') {
    error_log("$operation failed: " . $e->getMessage());
    
    // Don't expose internal database errors to client
    sendError("$operation failed", 500, [
        'error_code' => 'DATABASE_ERROR'
    ]);
}

/**
 * Send a health check response
 */
function sendHealthCheck() {
    sendResponse([
        'status' => 'healthy',
        'timestamp' => time(),
        'service' => 'stackmap-sync-api'
    ]);
}
?>