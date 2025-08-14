<?php
/**
 * Configuration file for StackMap share API
 * 
 * Copy this file to config.php and update with your actual database values
 */

// Detect environment based on path or referrer
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$httpReferer = $_SERVER['HTTP_REFERER'] ?? '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

// Check multiple indicators for qual environment
$isQual = (strpos($requestUri, '/qual/') !== false) || 
          (strpos($httpReferer, '/qual/') !== false) ||
          (strpos($scriptName, '/qual/') !== false);
          
$environment = $isQual ? 'qual' : 'prod';

// Database configuration for StackMap (not Manyla)
define('DB_HOST', 'localhost');

if ($environment === 'qual') {
    // Qual/testing database
    define('DB_NAME', 'your_stackmap_qual_database');
    define('DB_USER', 'your_stackmap_qual_user');
    define('DB_PASS', 'your_stackmap_qual_password');
} else {
    // Production database
    define('DB_NAME', 'your_stackmap_prod_database');
    define('DB_USER', 'your_stackmap_prod_user');
    define('DB_PASS', 'your_stackmap_prod_password');
}

// Encryption key for share data (use a long random string)
define('ENCRYPTION_KEY', 'your-secret-encryption-key-change-this');

// Timezone
date_default_timezone_set('America/New_York');

// Error reporting (disable display_errors in production)
error_reporting(E_ALL);
ini_set('display_errors', $environment === 'qual' ? 1 : 0);
ini_set('log_errors', 1);
?>