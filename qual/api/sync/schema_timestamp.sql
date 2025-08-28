-- Timestamp-based sync schema
-- This schema uses immutable append-only records instead of version numbers

CREATE TABLE IF NOT EXISTS sync_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    client_timestamp BIGINT NOT NULL,
    server_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    encrypted_blob LONGTEXT NOT NULL,
    
    INDEX idx_sync_device (sync_id, device_id),
    INDEX idx_sync_timestamp (sync_id, client_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metadata about sync groups
CREATE TABLE IF NOT EXISTS sync_groups (
    sync_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    device_count INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Track devices in each sync group
CREATE TABLE IF NOT EXISTS sync_devices (
    sync_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    push_count INT DEFAULT 0,
    
    PRIMARY KEY (sync_id, device_id),
    FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;