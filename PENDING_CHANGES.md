# Pending Changes

## Title: Complete Refactor - Timestamp-Based Sync System

### Major Architecture Change
Replaced version-number-based sync with timestamp-based sync to eliminate data loss bugs.

### Changes Made:

#### New Timestamp-Based Architecture
- **schema_timestamp.sql**: New database schema using timestamps instead of versions
  - Immutable append-only sync_records table
  - Tracks client_timestamp and server_timestamp for each sync
  - Maintains full history, not just latest state

#### Server-Side (PHP) Changes
- **create_timestamp.php**: Creates new sync groups with timestamp tracking
- **push_timestamp.php**: Stores sync records with timestamps (no version conflicts)
- **pull_timestamp.php**: Returns all records newer than client's last sync timestamp
  - 60-second protection for new devices still enforced
  - Catastrophic data loss prevention (50% reduction check)
  - Clock skew detection via server_time

#### Client-Side (JavaScript) Changes  
- **syncServiceTimestamp.js**: Complete rewrite of sync service
  - Uses timestamps instead of version numbers
  - No more version corruption issues
  - Last-Write-Wins based on actual time, not arbitrary versions
  - Protection flags maintained (61-second client-side protection)
  - Clock skew detection and handling

### Problems Solved:
1. **Version corruption bug eliminated** - No more jumping by 10+ versions
2. **Data loss prevented** - No blind overwrites based on version numbers
3. **Natural ordering** - Changes ordered by when they actually happened
4. **Better conflict resolution** - Timestamp + device_id for deterministic merging
5. **Race conditions fixed** - No more issues with simultaneous syncing

### Migration Strategy:
- Clean break from old system (no backward compatibility needed)
- All sync groups will need to be recreated
- Much more reliable and predictable sync behavior

### Testing Required:
- Create sync group on Device A
- Join from Device B after protection period
- Verify bidirectional sync works
- Test with clock skew between devices
- Verify no data loss scenarios