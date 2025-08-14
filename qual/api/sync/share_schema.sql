-- Share links table for StackMap
-- Stores temporary share tokens for provider access

CREATE TABLE IF NOT EXISTS share_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_id VARCHAR(36) UNIQUE NOT NULL,
    access_token VARCHAR(8) UNIQUE NOT NULL,
    sync_id VARCHAR(32) NOT NULL, -- Links to sync group
    user_id VARCHAR(50) NOT NULL, -- Specific user being shared
    encrypted_data TEXT NOT NULL, -- Encrypted user activity data
    recipient_name VARCHAR(255),
    share_note TEXT,
    include_completed BOOLEAN DEFAULT TRUE,
    include_tomorrow BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accessed_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    created_by_device VARCHAR(255),
    INDEX idx_token (access_token),
    INDEX idx_sync_id (sync_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up expired shares (run via cron)
-- DELETE FROM share_links WHERE expires_at < NOW();