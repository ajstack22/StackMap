<?php
/**
 * Database connection singleton for StackMap sync API
 * Supports both MySQL (production) and SQLite (local development)
 */

require_once 'config.php';

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            if (defined('DB_TYPE') && DB_TYPE === 'sqlite') {
                // SQLite for local development
                $this->connection = new PDO(
                    'sqlite:' . DB_PATH,
                    null,
                    null,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
                
                // Create tables if they don't exist
                $this->createSQLiteTables();
            } else {
                // MySQL for production
                $this->connection = new PDO(
                    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
            }
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }
    
    private function createSQLiteTables() {
        // Create tables for SQLite (simplified schema)
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS sync_groups (
                sync_id VARCHAR(64) PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                device_count INTEGER DEFAULT 1
            )
        ");
        
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS sync_devices (
                sync_id VARCHAR(64) NOT NULL,
                device_id VARCHAR(64) NOT NULL,
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                push_count INTEGER DEFAULT 0,
                PRIMARY KEY (sync_id, device_id),
                FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) ON DELETE CASCADE
            )
        ");
        
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS sync_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_id VARCHAR(64) NOT NULL,
                device_id VARCHAR(64) NOT NULL,
                client_timestamp BIGINT NOT NULL,
                server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                encrypted_blob TEXT NOT NULL
            )
        ");
        
        // Create indexes
        $this->connection->exec("CREATE INDEX IF NOT EXISTS idx_sync_device ON sync_records (sync_id, device_id)");
        $this->connection->exec("CREATE INDEX IF NOT EXISTS idx_sync_timestamp ON sync_records (sync_id, client_timestamp)");
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
?>