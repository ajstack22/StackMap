# Pending Changes

## Title: Capture hash fragment immediately before React renders

### Changes Made:
- Added immediate hash capture at module load time (before React renders)
- Stores sync data in window.syncInviteDataImmediate to preserve hash fragment
- Updated onboarding to check both immediate and regular sync data
- This prevents the hash from being lost due to timing issues

