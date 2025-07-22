#!/bin/bash
# Secure Database Setup Script for StackMap Sync
# Just update these two variables and run the script!

# ===== UPDATE THESE TWO VALUES =====
DB_USER="stackmap_sync_user"
DB_PASS="8VyqRLfTSXA8"
# ===================================

# Don't change anything below this line
echo "🔒 Setting up secure database configuration..."

# Create private directory outside public_html
mkdir -p ~/private
chmod 700 ~/private

# Create secure config file
cat > ~/private/stackmap-db-config.php << EOF
<?php
/**
 * StackMap Sync Database Configuration
 * This file is stored outside public_html for security
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'stachblx_stackmap_sync');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASS');
EOF

# Set strict permissions - only you can read this file
chmod 600 ~/private/stackmap-db-config.php

# Update the database.php file to use the secure config
cat > ~/public_html/api/config/database.php << 'EOF'
<?php
/**
 * Database connection using secure external config
 */

class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        // Load credentials from secure location
        $configFile = '/home/stachblx/private/stackmap-db-config.php';
        
        if (!file_exists($configFile)) {
            error_log("Database config file not found at: " . $configFile);
            die(json_encode(['error' => 'Configuration error']));
        }
        
        require_once $configFile;
        
        try {
            $this->pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            die(json_encode(['error' => 'Database connection failed']));
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}
EOF

# Verify the setup
echo "✅ Secure configuration created!"
echo ""
echo "📁 Files created:"
echo "   - ~/private/stackmap-db-config.php (credentials)"
echo "   - ~/public_html/api/config/database.php (connection class)"
echo ""
echo "🔒 Security check:"
ls -la ~/private/stackmap-db-config.php
echo ""
echo "🧪 Test your setup at: https://stackmap.app/api/sync/test.php"
echo ""
echo "⚠️  Important: Your credentials are now stored securely outside public_html"