# StackMap Sync - Data Cleanup Policy

## Overview

To maintain database efficiency and respect user privacy, StackMap Sync implements an automatic cleanup policy that removes inactive sync data after 6 months of no activity.

## Why 6 Months?

- **Activity Detection**: Since StackMap syncs all state changes (including completed activities), any regular use of the app will update the `last_modified` timestamp
- **Grace Period**: 6 months provides ample time for users who may take breaks from using the app
- **Storage Efficiency**: Prevents accumulation of abandoned data
- **Privacy**: Ensures data doesn't persist indefinitely if users stop using the service

## What Gets Updated (Keeps Data Active)

Any of these actions will update the `last_modified` timestamp and reset the 6-month timer:

- ✅ Completing/uncompleting any activity
- ✅ Adding new activities
- ✅ Editing activities
- ✅ Changing user preferences
- ✅ Switching users
- ✅ Modifying any settings
- ✅ Manual sync button press
- ✅ Automatic background sync (every 30 seconds when app is open)

## Implementation

### Automatic Cleanup

1. **Database Event** (Recommended)
   ```sql
   -- Enable event scheduler
   SET GLOBAL event_scheduler = ON;
   
   -- Event runs daily at 3 AM automatically
   ```

2. **Cron Job** (Alternative)
   ```bash
   # Add to crontab
   0 3 * * * curl -X POST https://stackmap.app/api/sync/cleanup.php \
     -H "X-Cleanup-Key: your-secret-key-here"
   ```

### Manual Cleanup

For immediate cleanup or testing:
```bash
curl -X POST https://stackmap.app/api/sync/cleanup.php \
  -H "X-Cleanup-Key: your-secret-key-here"
```

## What Gets Deleted

When sync data hasn't been modified for 6 months:

1. **sync_data** table entry (the encrypted blob)
2. **sync_devices** entries (via CASCADE)
3. Associated pairing sessions
4. Rate limit entries older than 1 hour
5. Metrics data older than 1 year

## Monitoring

Check inactive data before cleanup:
```sql
-- See distribution of activity
SELECT 
    CASE 
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 'Active (< 1 week)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 'Recent (< 1 month)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 'Inactive (1-3 months)'
        WHEN last_modified > DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN 'Stale (3-6 months)'
        ELSE 'Abandoned (> 6 months)'
    END as activity_status,
    COUNT(*) as sync_group_count
FROM sync_data
GROUP BY activity_status;
```

## User Communication

Consider notifying users before data deletion:

1. **In-App Warning**: Show a banner if sync hasn't happened in 5 months
2. **Recovery Period**: Users can re-sync with their recovery phrase even after deletion
3. **Clear Documentation**: Explain the policy in privacy/terms documentation

## Privacy Benefits

- ✅ Data doesn't persist indefinitely
- ✅ Reduces attack surface for old, unused data
- ✅ Complies with data minimization principles
- ✅ Users can trust their data won't linger forever

## Configuration

Set the cleanup key as an environment variable:
```bash
# In .env or server configuration
SYNC_CLEANUP_KEY=your-secure-random-key-here
```

## Metrics

The cleanup process logs anonymous metrics:
- Number of sync groups deleted
- Average days of inactivity
- Total devices affected
- Timestamp of cleanup

These metrics help monitor the health of the sync service without compromising privacy.