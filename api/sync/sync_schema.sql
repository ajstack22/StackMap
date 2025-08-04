-- Main sync data table for StackMap
CREATE TABLE IF NOT EXISTS sync_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(32) UNIQUE NOT NULL,
    encrypted_blob TEXT NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sync_id (sync_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sync devices table
CREATE TABLE IF NOT EXISTS sync_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    sync_id VARCHAR(32) NOT NULL,
    device_name VARCHAR(255),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_sync (device_id, sync_id),
    INDEX idx_sync_id (sync_id),
    FOREIGN KEY (sync_id) REFERENCES sync_data(sync_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update shares table to ensure it exists with all columns
CREATE TABLE IF NOT EXISTS shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_id VARCHAR(36) UNIQUE NOT NULL,
    sync_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    access_token VARCHAR(32) UNIQUE NOT NULL,
    encrypted_data LONGTEXT NOT NULL,
    recipient_name VARCHAR(255),
    share_note TEXT,
    include_completed BOOLEAN DEFAULT TRUE,
    include_tomorrow BOOLEAN DEFAULT TRUE,
    auto_update BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accessed_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    created_by_device VARCHAR(255),
    INDEX idx_token (access_token),
    INDEX idx_sync_id (sync_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;