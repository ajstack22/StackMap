# Pending Changes

## Title: Improve sync to reduce conflicts with immediate push and field timestamps

### Changes Made:
- Push changes immediately on store update (no 5-second delay)
- Pull other changes after 2-second debounce 
- Use field-level timestamps in conflict resolution
- If user data differs by >1 second, take the newer version entirely
- Prevents "completed cards" issue from simultaneous edits

