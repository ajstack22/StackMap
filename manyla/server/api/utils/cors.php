<?php
/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * Handles CORS headers for web clients
 */

/**
 * Set CORS headers based on request origin
 */
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Check if origin is allowed
    if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    } elseif (API_DEBUG && strpos($origin, 'localhost') !== false) {
        // Allow localhost in debug mode
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    }
    
    // Set other CORS headers
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
    header("Access-Control-Max-Age: 86400"); // 24 hours
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204); // No Content
        exit;
    }
}

/**
 * Set security headers
 */
function setSecurityHeaders() {
    foreach (SECURITY_HEADERS as $header => $value) {
        header("$header: $value");
    }
}

/**
 * Set standard API headers
 */
function setApiHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // API version header
    header('X-API-Version: ' . API_VERSION);
}

/**
 * Initialize all headers
 */
function initializeHeaders() {
    setCorsHeaders();
    setSecurityHeaders();
    setApiHeaders();
}
?>