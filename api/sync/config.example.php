<?php
/**
 * Configuration file for StackMap share API
 * 
 * Copy this file to config.php and update with your actual database values
 */

// Database configuration for StackMap (not Manyla)
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_stackmap_database_name');
define('DB_USER', 'your_stackmap_database_user');
define('DB_PASS', 'your_stackmap_database_password');

// Encryption key for share data (use a long random string)
define('ENCRYPTION_KEY', 'your-secret-encryption-key-change-this');

// Timezone
date_default_timezone_set('America/New_York');

// Error reporting (disable display_errors in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
?>