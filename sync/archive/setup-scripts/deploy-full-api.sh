#!/bin/bash
# Full deployment script for StackMap Sync API
# Run this in cPanel Terminal

echo "🚀 Deploying full StackMap Sync API..."

# Create all directories
mkdir -p ~/public_html/api/{sync,config,utils,logs}
chmod 755 ~/public_html/api/{sync,config,utils}
chmod 700 ~/public_html/api/logs

# Create .htaccess for API security
cat > ~/public_html/api/.htaccess << 'EOF'
# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"

# Hide logs directory
<Files "logs/*">
    Order deny,allow
    Deny from all
</Files>
EOF

# Create database config (YOU NEED TO UPDATE THIS)
cat > ~/public_html/api/config/database.php << 'EOF'
<?php
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        // UPDATE THESE CREDENTIALS
        $host = 'localhost';
        $db = 'stachblx_stackmap_sync';
        $user = 'stachblx_DBUSER';  // CHANGE THIS to your database user
        $pass = 'YOUR_PASSWORD';     // CHANGE THIS to your database password
        
        try {
            $this->pdo = new PDO(
                "mysql:host=$host;dbname=$db;charset=utf8mb4",
                $user, $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            error_log("DB Error: " . $e->getMessage());
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

# Create CORS helper
cat > ~/public_html/api/config/cors.php << 'EOF'
<?php
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Content-Type: application/json; charset=UTF-8");
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
EOF

# Create response utilities
cat > ~/public_html/api/utils/response.php << 'EOF'
<?php
function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function sendError($message, $code = 400) {
    sendResponse(['error' => true, 'message' => $message], $code);
}

function getJsonInput() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) sendError('Invalid JSON');
    return $data;
}
EOF

# Create test endpoint
cat > ~/public_html/api/sync/test.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT COUNT(*) as count FROM sync_data");
    $result = $stmt->fetch();
    
    sendResponse([
        'status' => 'ok',
        'database' => 'connected',
        'sync_groups' => $result['count'],
        'time' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    sendError('Database test failed: ' . $e->getMessage(), 500);
}
EOF

# Create 'create' endpoint
cat > ~/public_html/api/sync/create.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();
$data = getJsonInput();

// Validate required fields
if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) || !isset($data['recovery_salt'])) {
    sendError('Missing required fields');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if already exists
    $check = $db->prepare("SELECT sync_id FROM sync_data WHERE sync_id = ?");
    $check->execute([$data['sync_id']]);
    if ($check->rowCount() > 0) {
        sendError('Sync ID already exists', 409);
    }
    
    // Create new sync group
    $stmt = $db->prepare("
        INSERT INTO sync_data (sync_id, encrypted_blob, recovery_salt)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([
        $data['sync_id'],
        $data['encrypted_blob'],
        $data['recovery_salt']
    ]);
    
    sendResponse(['success' => true, 'sync_id' => $data['sync_id']], 201);
    
} catch (Exception $e) {
    sendError('Failed to create sync group', 500);
}
EOF

# Create 'push' endpoint
cat > ~/public_html/api/sync/push.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();
$data = getJsonInput();

if (!isset($data['sync_id']) || !isset($data['encrypted_blob']) || !isset($data['device_id'])) {
    sendError('Missing required fields');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Update sync data
    $stmt = $db->prepare("
        UPDATE sync_data 
        SET encrypted_blob = ?, version = version + 1
        WHERE sync_id = ?
    ");
    $stmt->execute([$data['encrypted_blob'], $data['sync_id']]);
    
    if ($stmt->rowCount() === 0) {
        sendError('Sync group not found', 404);
    }
    
    // Update device last seen
    $deviceStmt = $db->prepare("
        INSERT INTO sync_devices (device_id, sync_id, device_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP
    ");
    $deviceStmt->execute([
        $data['device_id'],
        $data['sync_id'],
        $data['device_name'] ?? 'Unknown Device'
    ]);
    
    sendResponse(['success' => true, 'version' => time()]);
    
} catch (Exception $e) {
    sendError('Push failed', 500);
}
EOF

# Create 'pull' endpoint
cat > ~/public_html/api/sync/pull.php << 'EOF'
<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/response.php';

setCorsHeaders();

$sync_id = $_GET['sync_id'] ?? null;
$device_id = $_GET['device_id'] ?? null;

if (!$sync_id || !$device_id) {
    sendError('Missing sync_id or device_id');
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get sync data
    $stmt = $db->prepare("
        SELECT encrypted_blob, version, last_modified
        FROM sync_data
        WHERE sync_id = ?
    ");
    $stmt->execute([$sync_id]);
    
    $result = $stmt->fetch();
    if (!$result) {
        sendError('Sync group not found', 404);
    }
    
    // Update device last seen
    $deviceStmt = $db->prepare("
        UPDATE sync_devices SET last_seen = CURRENT_TIMESTAMP
        WHERE device_id = ? AND sync_id = ?
    ");
    $deviceStmt->execute([$device_id, $sync_id]);
    
    sendResponse([
        'encrypted_blob' => $result['encrypted_blob'],
        'version' => $result['version'],
        'last_modified' => $result['last_modified']
    ]);
    
} catch (Exception $e) {
    sendError('Pull failed', 500);
}
EOF

# Set permissions
chmod 644 ~/public_html/api/.htaccess
chmod 644 ~/public_html/api/config/*.php
chmod 644 ~/public_html/api/utils/*.php
chmod 644 ~/public_html/api/sync/*.php

echo "✅ API deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: You must update the database credentials!"
echo "    Edit: ~/public_html/api/config/database.php"
echo ""
echo "📋 Available endpoints:"
echo "  - https://stackmap.app/api/sync/test.php    (Test connection)"
echo "  - https://stackmap.app/api/sync/create.php  (POST: Create sync group)"
echo "  - https://stackmap.app/api/sync/push.php    (POST: Push data)"
echo "  - https://stackmap.app/api/sync/pull.php    (GET: Pull data)"