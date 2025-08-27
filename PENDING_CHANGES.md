# Pending Changes

## Title: v22 - Global Protection Flags to Block Device B Push

### Changes Made:
- Added global window.__syncJustJoined and window.__syncJoinedAt flags
- These persist across all modules regardless of webpack caching
- Push function checks BOTH instance and global flags
- 30-second hard block on pushing after joining sync
- Alert messages show when protection is triggered
- This bypasses webpack module caching issues entirely

