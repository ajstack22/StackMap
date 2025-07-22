#!/bin/bash
# Deploy script for StackMap Sync API
# Run this in cPanel Terminal or via SSH

echo "🚀 Starting StackMap Sync API deployment..."

# Set the base directory (adjust if needed)
BASE_DIR="$HOME/public_html"
API_DIR="$BASE_DIR/api"

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$API_DIR/sync"
mkdir -p "$API_DIR/config"
mkdir -p "$API_DIR/utils"
mkdir -p "$API_DIR/logs"

# Set proper permissions
chmod 755 "$API_DIR"
chmod 755 "$API_DIR/sync"
chmod 755 "$API_DIR/config"
chmod 755 "$API_DIR/utils"
chmod 700 "$API_DIR/logs"  # More restrictive for logs

# Create .htaccess for API directory
echo "🔒 Creating .htaccess for security..."
cat > "$API_DIR/.htaccess" << 'EOF'
# Enable CORS for API
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"

# PHP settings
php_flag display_errors off
php_flag log_errors on
php_value error_log logs/error.log

# Deny access to logs
<Files "logs/*">
    Order deny,allow
    Deny from all
</Files>

# Pretty URLs (optional)
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^sync/([^/]+)/?$ sync/$1.php [L,QSA]
EOF

# Create database configuration
echo "🔧 Creating database configuration..."
cat > "$API_DIR/config/database.php" << 'EOF'
<?php
/**
 * Database configuration for StackMap Sync
 * IMPORTANT: Update the credentials below
 */

class Database {
    private static $instance = null;
    private $pdo;
    
    // UPDATE THESE VALUES
    private $host = 'localhost';
    private $db = 'stachblx_stackmap_sync';
    private $user = 'YOUR_DB_USER';  // <-- CHANGE THIS
    private $pass = 'YOUR_DB_PASS';  // <-- CHANGE THIS
    
    private function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host={$this->host};dbname={$this->db};charset=utf8mb4",
                $this->user,
                $this->pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
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

# Create CORS configuration
echo "📡 Creating CORS configuration..."
cat > "$API_DIR/config/cors.php" << 'EOF'
<?php
/**
 * CORS configuration for API endpoints
 */

function setCorsHeaders() {
    // Allow from any origin during development
    // TODO: Restrict to specific domains in production
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
EOF

# Create response utility
echo "🛠️ Creating response utility..."
cat > "$API_DIR/utils/response.php" << 'EOF'
<?php
/**
 * Standard API response utilities
 */

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'error' => true,
        'message' => $message
    ]);
    exit();
}

function validateRequest($required = []) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendError('Invalid JSON', 400);
    }
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
    
    return $data;
}
EOF

# Create test endpoint
echo "🧪 Creating test endpoint..."
cat > "$API_DIR/sync/test.php" << 'EOF'
<?php
/**
 * Test endpoint to verify API setup
 */

require_once '../config/cors.php';
require_once '../utils/response.php';

setCorsHeaders();

// Test database connection
try {
    require_once '../config/database.php';
    $db = Database::getInstance()->getConnection();
    
    // Test query
    $stmt = $db->query("SELECT COUNT(*) as count FROM sync_data");
    $result = $stmt->fetch();
    
    sendResponse([
        'status' => 'success',
        'message' => 'API is working correctly',
        'database' => 'connected',
        'sync_data_count' => $result['count'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}
EOF

# Create the create endpoint
echo "📝 Creating 'create' endpoint..."
cat > "$API_DIR/sync/create.php" << 'EOF'
<?php
/**
 * Create a new sync group
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();

// Validate request
$data = validateRequest(['sync_id', 'encrypted_blob', 'recovery_salt']);

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if sync_id already exists
    $checkStmt = $db->prepare("SELECT sync_id FROM sync_data WHERE sync_id = ?");
    $checkStmt->execute([$data['sync_id']]);
    
    if ($checkStmt->rowCount() > 0) {
        sendError('Sync ID already exists', 409);
    }
    
    // Insert new sync group
    $stmt = $db->prepare("
        INSERT INTO sync_data (sync_id, encrypted_blob, recovery_salt)
        VALUES (?, ?, ?)
    ");
    
    $stmt->execute([
        $data['sync_id'],
        $data['encrypted_blob'],
        $data['recovery_salt']
    ]);
    
    // Log metric
    $metricStmt = $db->prepare("
        INSERT INTO sync_metrics (event, metadata)
        VALUES ('sync_created', ?)
    ");
    $metricStmt->execute([json_encode(['sync_id' => $data['sync_id']])]);
    
    sendResponse([
        'success' => true,
        'sync_id' => $data['sync_id'],
        'created_at' => date('Y-m-d H:i:s')
    ], 201);
    
} catch (Exception $e) {
    error_log("Create sync error: " . $e->getMessage());
    sendError('Failed to create sync group', 500);
}
EOF

echo "✅ API deployment script created!"
echo ""
echo "📋 Next steps:"
echo "1. Update database credentials in $API_DIR/config/database.php"
echo "2. Test the API at: https://stackmap.app/api/sync/test"
echo ""
echo "🔐 Security reminder: Make sure to update CORS settings for production!"