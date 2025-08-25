# Pending Changes

## Title: Fix conflict resolution to prefer timestamped versions

### Changes Made:
- Corrected conflict resolution logic to prefer timestamped versions over non-timestamped
- Activities with timestamps are considered "edited" and more recent than legacy data
- This combined with timestamp additions prevents sync reversion issues