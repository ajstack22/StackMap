# Pending Changes

## Title: Fix Share List Database Mismatch

### Changes Made:
- Fixed list_shares.php to query share_links table instead of shares table
- Changed list_shares.php to use sync_id instead of device_id
- Updated JavaScript to send sync_id when fetching shares
- Fixed delete_share.php to delete from share_links table
- Shares now properly persist and display in the active shares list

