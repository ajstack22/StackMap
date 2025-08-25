# Pending Changes

## Title: Fix single-device sync reverting edits during rapid changes

### Changes Made:
- Added modifiedAt timestamp when adding activities from library
- Increased sync debounce from 5 to 10 seconds to prevent self-conflicts
- Activities now always have timestamps for proper conflict resolution
- Prevents sync from creating conflicts with its own recent pushes