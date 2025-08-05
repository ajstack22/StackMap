<?php
/**
 * Database configuration singleton
 * Wraps the existing database.php connection
 */

require_once __DIR__ . '/../sync/database.php';

class Database {
    private static $instance = null;
    private $connection = null;

    private function __construct() {
        // Use the existing getDB function from sync/database.php
        $this->connection = getDB();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}
?>