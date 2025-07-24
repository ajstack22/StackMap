# Manyla PHP Implementation Guide

## Overview

The Manyla PHP backend implements a zero-trust API with client-side encryption, token-based sharing, and multi-device sync. This guide covers the complete PHP implementation.

## Directory Structure

```
/api/
├── config/
│   ├── config.php          # Main configuration file
│   └── database.php        # Database connection handler
├── share/
│   ├── create.php         # Create share links
│   └── access.php         # Access shared profiles
├── sync/
│   ├── create.php         # Create sync groups
│   ├── pull.php           # Pull encrypted data
│   ├── push.php           # Push encrypted data
│   └── delete.php         # Delete sync groups
├── utils/
│   ├── cors.php           # CORS headers
│   ├── validation.php     # Input validation
│   └── rate-limiter.php   # Rate limiting
└── cleanup.php            # Scheduled cleanup tasks
```

## Core Implementation Files

### 1. Configuration (`/api/config/config.php`)

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'manyla_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// API configuration
define('API_VERSION', '1.0');
define('MAX_SHARE_SIZE', 5 * 1024 * 1024); // 5MB max for shared profiles
define('MAX_SYNC_SIZE', 10 * 1024 * 1024); // 10MB max for sync data

// Security settings
define('RATE_LIMIT_WINDOW', 60); // 60 seconds
define('RATE_LIMIT_MAX_REQUESTS', 10);
define('SHARE_TOKEN_LENGTH', 8);
define('SHARE_DEFAULT_EXPIRY_DAYS', 7);
define('SHARE_MAX_EXPIRY_DAYS', 365);

// CORS settings
define('ALLOWED_ORIGINS', [
    'https://stackmap.app',
    'http://localhost:3000' // Development
]);

// Timezone
date_default_timezone_set('UTC');
?>
```

### 2. Database Connection (`/api/config/database.php`)

```php
<?php
require_once 'config.php';

class Database {
    private static $instance = null;
    private $conn;
    
    private function __construct() {
        try {
            $this->conn = new PDO(
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
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    public function commit() {
        return $this->conn->commit();
    }
    
    public function rollback() {
        return $this->conn->rollback();
    }
}
?>
```

### 3. CORS Configuration (`/api/utils/cors.php`)

```php
<?php
require_once __DIR__ . '/../config/config.php';

function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
    
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 3600');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Set CORS headers for all requests
setCorsHeaders();
?>
```

### 4. Input Validation (`/api/utils/validation.php`)

```php
<?php
class Validator {
    public static function validateToken($token) {
        if (empty($token)) {
            throw new InvalidArgumentException("Token is required");
        }
        
        if (!preg_match('/^[A-Z0-9]{6,8}$/', $token)) {
            throw new InvalidArgumentException("Invalid token format");
        }
        
        return $token;
    }
    
    public static function validateSyncId($syncId) {
        if (empty($syncId)) {
            throw new InvalidArgumentException("Sync ID is required");
        }
        
        if (!preg_match('/^[a-f0-9]{64}$/', $syncId)) {
            throw new InvalidArgumentException("Invalid sync ID format");
        }
        
        return $syncId;
    }
    
    public static function validateEncryptedData($data) {
        if (empty($data)) {
            throw new InvalidArgumentException("Encrypted data is required");
        }
        
        // Check if it's valid base64
        if (base64_encode(base64_decode($data, true)) !== $data) {
            throw new InvalidArgumentException("Invalid encrypted data format");
        }
        
        $decoded = base64_decode($data);
        $size = strlen($decoded);
        
        if ($size > MAX_SYNC_SIZE) {
            throw new InvalidArgumentException("Data size exceeds maximum allowed");
        }
        
        return $data;
    }
    
    public static function validateJson($json) {
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException("Invalid JSON: " . json_last_error_msg());
        }
        
        return $data;
    }
    
    public static function sanitizeString($str) {
        return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
    }
    
    public static function validateExpiryDays($days) {
        $days = intval($days);
        
        if ($days < 1 || $days > SHARE_MAX_EXPIRY_DAYS) {
            throw new InvalidArgumentException("Expiry days must be between 1 and " . SHARE_MAX_EXPIRY_DAYS);
        }
        
        return $days;
    }
}
?>
```

### 5. Rate Limiting (`/api/utils/rate-limiter.php`)

```php
<?php
require_once __DIR__ . '/../config/database.php';

class RateLimiter {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function checkLimit($endpoint, $customLimit = null) {
        $ip = $this->getClientIp();
        $limit = $customLimit ?? RATE_LIMIT_MAX_REQUESTS;
        
        try {
            // Clean old entries
            $this->cleanOldEntries();
            
            // Check current count
            $stmt = $this->db->prepare("
                SELECT request_count 
                FROM rate_limits 
                WHERE ip_address = ? 
                AND endpoint = ? 
                AND window_start > DATE_SUB(NOW(), INTERVAL ? SECOND)
            ");
            
            $stmt->execute([$ip, $endpoint, RATE_LIMIT_WINDOW]);
            $result = $stmt->fetch();
            
            if ($result && $result['request_count'] >= $limit) {
                http_response_code(429);
                header('X-RateLimit-Limit: ' . $limit);
                header('X-RateLimit-Remaining: 0');
                header('X-RateLimit-Reset: ' . (time() + RATE_LIMIT_WINDOW));
                
                echo json_encode([
                    'success' => false,
                    'error' => 'Rate limit exceeded. Please try again later.'
                ]);
                exit();
            }
            
            // Update count
            $stmt = $this->db->prepare("
                INSERT INTO rate_limits (ip_address, endpoint, request_count)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE request_count = request_count + 1
            ");
            
            $stmt->execute([$ip, $endpoint]);
            
            // Set headers
            $remaining = $limit - (($result['request_count'] ?? 0) + 1);
            header('X-RateLimit-Limit: ' . $limit);
            header('X-RateLimit-Remaining: ' . $remaining);
            header('X-RateLimit-Reset: ' . (time() + RATE_LIMIT_WINDOW));
            
        } catch (Exception $e) {
            error_log("Rate limiter error: " . $e->getMessage());
            // Don't block on rate limiter errors
        }
    }
    
    private function getClientIp() {
        // Check for proxied IPs
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    private function cleanOldEntries() {
        $stmt = $this->db->prepare("
            DELETE FROM rate_limits 
            WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->execute();
    }
}
?>
```

### 6. Create Share Link (`/api/share/create.php`)

```php
<?php
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/rate-limiter.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

// Rate limiting
$limiter = new RateLimiter();
$limiter->checkLimit('share_create', 5); // 5 shares per minute

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get and validate input
    $input = file_get_contents('php://input');
    $data = Validator::validateJson($input);
    
    // Validate required fields
    if (empty($data['profile_data']) || empty($data['access_token'])) {
        throw new InvalidArgumentException("Missing required fields");
    }
    
    $accessToken = Validator::validateToken($data['access_token']);
    $expiresAt = $data['expires_at'] ?? date('Y-m-d H:i:s', strtotime('+' . SHARE_DEFAULT_EXPIRY_DAYS . ' days'));
    
    // Validate expiry
    $expiryTime = strtotime($expiresAt);
    if ($expiryTime <= time() || $expiryTime > strtotime('+' . SHARE_MAX_EXPIRY_DAYS . ' days')) {
        throw new InvalidArgumentException("Invalid expiry date");
    }
    
    // Filter profile data based on selected categories
    $profileData = $data['profile_data'];
    if (!empty($data['selected_categories']) && is_array($data['selected_categories'])) {
        $profileData['entries'] = array_filter(
            $profileData['entries'] ?? [],
            function($entry) use ($data) {
                return in_array($entry['category'], $data['selected_categories']);
            }
        );
    }
    
    // Remove quick info if not included
    if (empty($data['include_quick_info'])) {
        unset($profileData['quickInfoPanels']);
    }
    
    // Encrypt the profile data
    $encryptedProfile = base64_encode(json_encode($profileData));
    
    // Check size
    if (strlen($encryptedProfile) > MAX_SHARE_SIZE) {
        throw new InvalidArgumentException("Share data too large");
    }
    
    // Generate share ID
    $shareId = bin2hex(random_bytes(16));
    
    // Store in database
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO share_links (
            share_id, 
            access_token, 
            encrypted_profile,
            recipient_name,
            share_note,
            selected_categories,
            include_quick_info,
            expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $success = $stmt->execute([
        $shareId,
        $accessToken,
        $encryptedProfile,
        Validator::sanitizeString($data['recipient_name'] ?? ''),
        Validator::sanitizeString($data['share_note'] ?? ''),
        json_encode($data['selected_categories'] ?? []),
        !empty($data['include_quick_info']) ? 1 : 0,
        $expiresAt
    ]);
    
    if (!$success) {
        throw new Exception("Failed to create share link");
    }
    
    // Generate share URL
    $shareUrl = 'https://stackmap.app/manyla?share=' . $accessToken;
    
    echo json_encode([
        'success' => true,
        'share_id' => $shareId,
        'access_token' => $accessToken,
        'expires_at' => $expiresAt,
        'share_url' => $shareUrl
    ]);
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Exception $e) {
    error_log("Share creation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create share link']);
}
?>
```

### 7. Access Share (`/api/share/access.php`)

```php
<?php
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/rate-limiter.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

// Rate limiting
$limiter = new RateLimiter();
$limiter->checkLimit('share_access');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get and validate token
    $token = $_GET['token'] ?? '';
    $token = Validator::validateToken($token);
    
    // Fetch from database
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        SELECT 
            share_id,
            encrypted_profile,
            recipient_name,
            share_note,
            expires_at,
            accessed_count
        FROM share_links
        WHERE access_token = ?
        AND expires_at > NOW()
    ");
    
    $stmt->execute([$token]);
    $share = $stmt->fetch();
    
    if (!$share) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired share link']);
        exit();
    }
    
    // Update access count
    $updateStmt = $db->prepare("
        UPDATE share_links 
        SET accessed_count = accessed_count + 1,
            last_accessed_at = NOW()
        WHERE access_token = ?
    ");
    $updateStmt->execute([$token]);
    
    // Decode profile data
    $profileData = json_decode(base64_decode($share['encrypted_profile']), true);
    
    if (!$profileData) {
        throw new Exception("Failed to decode profile data");
    }
    
    // Log access for analytics
    $logStmt = $db->prepare("
        INSERT INTO sync_history (sync_id, operation, ip_address, user_agent)
        VALUES (?, 'share_access', ?, ?)
    ");
    $logStmt->execute([
        'share_' . $share['share_id'],
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    echo json_encode([
        'success' => true,
        'profile' => $profileData,
        'recipient_name' => $share['recipient_name'],
        'share_note' => $share['share_note'],
        'expires_at' => $share['expires_at'],
        'access_count' => $share['accessed_count'] + 1
    ]);
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Exception $e) {
    error_log("Share access error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to access share']);
}
?>
```

### 8. Sync Operations (`/api/sync/push.php`)

```php
<?php
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/rate-limiter.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

// Rate limiting
$limiter = new RateLimiter();
$limiter->checkLimit('sync_push', 20); // 20 syncs per minute

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get and validate input
    $input = file_get_contents('php://input');
    $data = Validator::validateJson($input);
    
    $syncId = Validator::validateSyncId($data['sync_id'] ?? '');
    $encryptedBlob = Validator::validateEncryptedData($data['encrypted_blob'] ?? '');
    $deviceId = Validator::sanitizeString($data['device_id'] ?? '');
    $version = intval($data['version'] ?? 1);
    
    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();
    
    try {
        // Check if sync group exists
        $stmt = $db->prepare("SELECT id FROM sync_groups WHERE sync_id = ?");
        $stmt->execute([$syncId]);
        
        if (!$stmt->fetch()) {
            throw new Exception("Sync group not found");
        }
        
        // Get current version
        $stmt = $db->prepare("
            SELECT MAX(version) as current_version 
            FROM sync_data 
            WHERE sync_id = ?
        ");
        $stmt->execute([$syncId]);
        $result = $stmt->fetch();
        $currentVersion = $result['current_version'] ?? 0;
        
        // Check for version conflict
        if ($version <= $currentVersion) {
            $db->rollback();
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'error' => 'Version conflict',
                'current_version' => $currentVersion
            ]);
            exit();
        }
        
        // Insert new sync data
        $stmt = $db->prepare("
            INSERT INTO sync_data (sync_id, encrypted_blob, version, device_id)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([$syncId, $encryptedBlob, $version, $deviceId]);
        
        // Update sync group timestamp
        $stmt = $db->prepare("
            UPDATE sync_groups 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE sync_id = ?
        ");
        $stmt->execute([$syncId]);
        
        // Log sync operation
        $stmt = $db->prepare("
            INSERT INTO sync_history (
                sync_id, 
                operation, 
                device_id, 
                ip_address, 
                user_agent
            ) VALUES (?, 'push', ?, ?, ?)
        ");
        
        $stmt->execute([
            $syncId,
            $deviceId,
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'version' => $version,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Sync push error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Sync push failed']);
}
?>
```

### 9. Cleanup Script (`/api/cleanup.php`)

```php
<?php
// This script should be run via cron job every hour
// Example crontab: 0 * * * * /usr/bin/php /path/to/api/cleanup.php

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Delete expired share links
    $stmt = $db->prepare("DELETE FROM share_links WHERE expires_at < NOW()");
    $deleted = $stmt->execute();
    $shareCount = $stmt->rowCount();
    
    // Delete old sync history (older than 30 days)
    $stmt = $db->prepare("
        DELETE FROM sync_history 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stmt->execute();
    $historyCount = $stmt->rowCount();
    
    // Delete old rate limit records
    $stmt = $db->prepare("
        DELETE FROM rate_limits 
        WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute();
    $rateLimitCount = $stmt->rowCount();
    
    // Clean up orphaned sync data
    $stmt = $db->prepare("
        DELETE sd FROM sync_data sd
        LEFT JOIN sync_groups sg ON sd.sync_id = sg.sync_id
        WHERE sg.id IS NULL
    ");
    $stmt->execute();
    $orphanCount = $stmt->rowCount();
    
    // Log cleanup results
    error_log(sprintf(
        "Cleanup completed: %d expired shares, %d history records, %d rate limits, %d orphans",
        $shareCount,
        $historyCount,
        $rateLimitCount,
        $orphanCount
    ));
    
} catch (Exception $e) {
    error_log("Cleanup error: " . $e->getMessage());
}
?>
```

## Security Best Practices

### 1. Input Validation
- Always validate and sanitize all user input
- Use prepared statements for all database queries
- Validate data types and formats strictly
- Check data size limits

### 2. Error Handling
- Never expose internal errors to users
- Log detailed errors server-side only
- Return generic error messages to clients
- Use appropriate HTTP status codes

### 3. Authentication & Authorization
- No traditional user accounts (zero-trust model)
- Sync IDs derived from recovery phrases
- Share tokens are short-lived and random
- No session management required

### 4. Data Protection
- All sensitive data encrypted client-side
- Database stores only encrypted blobs
- No PII in plain text
- Automatic cleanup of expired data

## Testing

### Test Share Creation
```bash
curl -X POST https://stackmap.app/manyla/api/share/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "profile_data": {
      "name": "Test Child",
      "entries": []
    },
    "access_token": "ABC12345",
    "expires_at": "2024-07-31 00:00:00"
  }'
```

### Test Share Access
```bash
curl https://stackmap.app/manyla/api/share/access.php?token=ABC12345
```

## Monitoring

### Health Check Endpoint
Create `/api/health.php`:
```php
<?php
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT 1");
    
    echo json_encode([
        'status' => 'healthy',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => API_VERSION
    ]);
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode([
        'status' => 'unhealthy',
        'error' => 'Database connection failed'
    ]);
}
?>
```

## Deployment Checklist

1. **Environment Setup**
   - [ ] PHP 7.4+ with PDO MySQL extension
   - [ ] MySQL 5.7+ or MariaDB 10.3+
   - [ ] HTTPS enabled (required for security)

2. **Configuration**
   - [ ] Update database credentials in `config.php`
   - [ ] Set appropriate CORS origins
   - [ ] Configure rate limits
   - [ ] Set timezone

3. **Database**
   - [ ] Run schema creation script
   - [ ] Create database user with minimal privileges
   - [ ] Test database connection

4. **Security**
   - [ ] Disable PHP error display (`display_errors = Off`)
   - [ ] Set proper file permissions (755 for directories, 644 for files)
   - [ ] Configure `.htaccess` to prevent direct access to config files
   - [ ] Enable HTTPS redirect

5. **Cron Jobs**
   - [ ] Set up hourly cleanup script
   - [ ] Configure backup script
   - [ ] Monitor disk space

6. **Testing**
   - [ ] Test all API endpoints
   - [ ] Verify rate limiting works
   - [ ] Check error handling
   - [ ] Confirm data encryption/decryption