<?php
/**
 * Local development configuration for StackMap sync API
 * Using SQLite for local testing
 */

// For local testing, we'll use SQLite instead of MySQL
define('DB_TYPE', 'sqlite');
define('DB_PATH', __DIR__ . '/sync_local.db');

// MySQL config (not used in local, but needed for compatibility)
define('DB_HOST', 'localhost');
define('DB_NAME', 'stackmap_sync');
define('DB_USER', 'root');
define('DB_PASS', '');

// Encryption key for share data
define('ENCRYPTION_KEY', 'local-test-key-not-for-production');

// Timezone
date_default_timezone_set('America/New_York');

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
?>