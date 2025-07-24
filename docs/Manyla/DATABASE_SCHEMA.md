# Manyla Database Schema Documentation

## Overview

Manyla uses MySQL to store encrypted sync data and temporary share links. The database follows a zero-trust model where all sensitive data is encrypted client-side before storage.

## Database Structure

### Database Name: `manyla_db`

## Tables

### 1. `sync_groups`

Stores sync group information for multi-device synchronization.

```sql
CREATE TABLE sync_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(64) UNIQUE NOT NULL,
    recovery_salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sync_id (sync_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Auto-incrementing primary key
- `sync_id`: Unique identifier derived from recovery phrase (indexed for fast lookups)
- `recovery_salt`: Salt used in key derivation (stored for recovery validation)
- `created_at`: Timestamp when sync group was created
- `updated_at`: Timestamp of last modification

### 2. `sync_data`

Stores encrypted profile data for each sync group.

```sql
CREATE TABLE sync_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(64) NOT NULL,
    encrypted_blob TEXT NOT NULL,
    version INT DEFAULT 1,
    device_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) ON DELETE CASCADE,
    INDEX idx_sync_version (sync_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Auto-incrementing primary key
- `sync_id`: Foreign key to sync_groups
- `encrypted_blob`: Base64-encoded encrypted profile data
- `version`: Version number for conflict resolution
- `device_id`: Identifier of the device that made the update
- `created_at`: Timestamp when data was created
- `updated_at`: Timestamp of last modification

### 3. `share_links`

Stores temporary share links with access tokens.

```sql
CREATE TABLE share_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_id VARCHAR(36) UNIQUE NOT NULL,
    access_token VARCHAR(8) UNIQUE NOT NULL,
    encrypted_profile TEXT NOT NULL,
    recipient_name VARCHAR(255),
    share_note TEXT,
    selected_categories JSON,
    include_quick_info BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accessed_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    INDEX idx_token (access_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Auto-incrementing primary key
- `share_id`: UUID for the share link
- `access_token`: 6-8 character access code (indexed for fast lookups)
- `encrypted_profile`: Encrypted profile data (filtered based on selected_categories)
- `recipient_name`: Optional name of the recipient
- `share_note`: Optional note from the sharer
- `selected_categories`: JSON array of category names included in share
- `include_quick_info`: Whether quick info panels are included
- `created_at`: When the share link was created
- `expires_at`: When the share link expires (indexed for cleanup)
- `accessed_count`: Number of times the link has been accessed
- `last_accessed_at`: Timestamp of last access

### 4. `sync_history`

Tracks sync operations for debugging and conflict resolution.

```sql
CREATE TABLE sync_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(64) NOT NULL,
    operation ENUM('create', 'push', 'pull', 'delete') NOT NULL,
    device_id VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) ON DELETE CASCADE,
    INDEX idx_sync_history (sync_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Auto-incrementing primary key
- `sync_id`: Foreign key to sync_groups
- `operation`: Type of sync operation performed
- `device_id`: Device that performed the operation
- `ip_address`: IP address of the request
- `user_agent`: Browser/app user agent
- `success`: Whether the operation succeeded
- `error_message`: Error details if operation failed
- `created_at`: When the operation occurred

### 5. `rate_limits`

Tracks API rate limiting per IP address.

```sql
CREATE TABLE rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ip_endpoint (ip_address, endpoint),
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Auto-incrementing primary key
- `ip_address`: IP address making requests
- `endpoint`: API endpoint being accessed
- `request_count`: Number of requests in current window
- `window_start`: Start of the current rate limit window

## Indexes

### Performance Indexes
- `idx_sync_id`: Fast lookup of sync groups
- `idx_sync_version`: Efficient version checking for sync conflicts
- `idx_token`: Quick access to share links by token
- `idx_expires`: Efficient cleanup of expired shares
- `idx_sync_history`: Fast retrieval of sync history
- `idx_window`: Efficient rate limit cleanup

## Data Retention

### Automatic Cleanup
1. **Expired Share Links**: Deleted after `expires_at` timestamp
2. **Old Sync History**: Entries older than 30 days are purged
3. **Rate Limit Records**: Cleared after 1 hour
4. **Orphaned Sync Data**: Removed if sync group is deleted

### Cleanup Script
Run via cron job every hour:
```sql
-- Delete expired share links
DELETE FROM share_links WHERE expires_at < NOW();

-- Delete old sync history
DELETE FROM sync_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Delete old rate limit records
DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

## Security Considerations

1. **Encryption**: All sensitive data (`encrypted_blob`, `encrypted_profile`) is encrypted client-side
2. **No PII**: Database stores no personally identifiable information in plain text
3. **Token Security**: Access tokens are short, random, and time-limited
4. **Cascade Deletes**: Removing a sync group removes all associated data
5. **JSON Columns**: Used for flexible schema without exposing structure

## Migration from Development

### Initial Setup
```sql
CREATE DATABASE IF NOT EXISTS manyla_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE manyla_db;
```

### Development to Production
1. Export development data: `mysqldump -u dev_user -p manyla_db > manyla_dev.sql`
2. Import to production: `mysql -u prod_user -p manyla_db < manyla_dev.sql`
3. Update `config.php` with production credentials
4. Verify indexes: `SHOW INDEXES FROM table_name;`

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/manyla"
mysqldump -u backup_user -p'password' manyla_db | gzip > $BACKUP_DIR/manyla_db_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "manyla_db_*.sql.gz" -mtime +7 -delete
```

### Restore from Backup
```bash
gunzip < manyla_db_20240724_120000.sql.gz | mysql -u root -p manyla_db
```

## Performance Optimization

### Query Optimization
- Use `EXPLAIN` to analyze slow queries
- Ensure foreign keys are indexed
- Monitor slow query log

### Table Maintenance
```sql
-- Analyze tables for optimizer
ANALYZE TABLE sync_groups, sync_data, share_links;

-- Optimize tables to reclaim space
OPTIMIZE TABLE share_links;
```

## Monitoring Queries

### Active Shares
```sql
SELECT COUNT(*) as active_shares,
       AVG(accessed_count) as avg_accesses
FROM share_links
WHERE expires_at > NOW();
```

### Sync Group Statistics
```sql
SELECT sg.sync_id,
       COUNT(DISTINCT sh.device_id) as device_count,
       MAX(sh.created_at) as last_sync,
       sd.version as current_version
FROM sync_groups sg
LEFT JOIN sync_history sh ON sg.sync_id = sh.sync_id
LEFT JOIN sync_data sd ON sg.sync_id = sd.sync_id
GROUP BY sg.sync_id;
```

### Storage Usage
```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'manyla_db'
ORDER BY (data_length + index_length) DESC;
```