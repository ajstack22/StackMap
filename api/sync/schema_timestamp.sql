-- Timestamp-based sync schema for StackMap
-- Replaces version-based sync with timestamp-based approach

-- Main sync records table (immutable, append-only)
CREATE TABLE IF NOT EXISTS sync_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    client_timestamp BIGINT NOT NULL,  -- Unix timestamp in milliseconds from client
    server_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),  -- When server received it
    encrypted_blob LONGTEXT NOT NULL,
    blob_hash VARCHAR(64) DEFAULT NULL,  -- Optional: SHA-256 of blob for deduplication
    
    INDEX idx_sync_timestamp (sync_id, client_timestamp),
    INDEX idx_sync_server_time (sync_id, server_timestamp),
    INDEX idx_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Track sync groups (simplified)
CREATE TABLE IF NOT EXISTS sync_groups (
    sync_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_records INT DEFAULT 0,
    active_devices INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Track devices with protection timestamps
CREATE TABLE IF NOT EXISTS sync_devices (
    device_id VARCHAR(64) NOT NULL,
    sync_id VARCHAR(64) NOT NULL,
    device_name VARCHAR(255) DEFAULT 'Unknown Device',
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_sync_timestamp BIGINT DEFAULT 0,  -- Last client timestamp this device synced
    can_push_after TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Protection: when device can push
    
    PRIMARY KEY (device_id, sync_id),
    INDEX idx_sync_devices (sync_id),
    INDEX idx_can_push (can_push_after)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: Track sync metrics for debugging
CREATE TABLE IF NOT EXISTS sync_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event VARCHAR(50) NOT NULL,
    sync_id VARCHAR(64),
    device_id VARCHAR(64),
    metadata JSON,
    
    INDEX idx_created (created_at),
    INDEX idx_event (event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration helper view to find latest state per sync group
CREATE VIEW latest_sync_state AS
SELECT 
    s1.sync_id,
    s1.device_id,
    s1.client_timestamp,
    s1.encrypted_blob
FROM sync_records s1
INNER JOIN (
    SELECT sync_id, MAX(client_timestamp) as max_timestamp
    FROM sync_records
    GROUP BY sync_id
) s2 ON s1.sync_id = s2.sync_id AND s1.client_timestamp = s2.max_timestamp;