-- StackMap Sync Database Cleanup Policy
-- Removes inactive sync data after 6 months of no modifications

-- Add a cleanup procedure for inactive sync data
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS cleanup_inactive_sync_data()
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    
    -- Log metrics before deletion (anonymous stats)
    INSERT INTO sync_metrics (event, metadata)
    SELECT 
        'cleanup_inactive_data',
        JSON_OBJECT(
            'deleted_count', COUNT(*),
            'avg_days_inactive', AVG(DATEDIFF(NOW(), last_modified)),
            'total_device_count', SUM(device_count)
        )
    FROM sync_data 
    WHERE last_modified < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    -- Delete sync data that hasn't been modified in 6 months
    DELETE FROM sync_data 
    WHERE last_modified < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    SET deleted_count = ROW_COUNT();
    
    -- The CASCADE foreign key will automatically clean up related devices
    
    -- Return the number of deleted sync groups
    SELECT deleted_count as deleted_sync_groups;
END$$

-- Create a more comprehensive cleanup procedure
CREATE PROCEDURE IF NOT EXISTS cleanup_all_old_data()
BEGIN
    -- Clean up inactive sync data (6 months)
    CALL cleanup_inactive_sync_data();
    
    -- Clean up expired pairing sessions
    DELETE FROM pairing_sessions WHERE expires_at < NOW();
    
    -- Clean up old rate limit entries
    DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Clean up old metrics (keep 1 year for analytics)
    DELETE FROM sync_metrics WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END$$

DELIMITER ;

-- Create an event to run cleanup daily at 3 AM
-- Note: Requires EVENT scheduler to be enabled
-- Run: SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
DO
    CALL cleanup_all_old_data();

-- Query to check inactive sync data (for monitoring)
-- This shows sync groups that would be deleted by the cleanup
SELECT 
    COUNT(*) as inactive_sync_groups,
    MIN(last_modified) as oldest_activity,
    MAX(last_modified) as newest_inactive,
    SUM(device_count) as total_devices_affected
FROM sync_data 
WHERE last_modified < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Query to see activity distribution
SELECT 
    CASE 
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 'Active (< 1 week)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 'Recent (< 1 month)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 'Inactive (1-3 months)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN 'Stale (3-6 months)'
        ELSE 'Abandoned (> 6 months)'
    END as activity_status,
    COUNT(*) as sync_group_count,
    SUM(device_count) as total_devices
FROM sync_data
GROUP BY activity_status
ORDER BY 
    CASE activity_status
        WHEN 'Active (< 1 week)' THEN 1
        WHEN 'Recent (< 1 month)' THEN 2
        WHEN 'Inactive (1-3 months)' THEN 3
        WHEN 'Stale (3-6 months)' THEN 4
        WHEN 'Abandoned (> 6 months)' THEN 5
    END;