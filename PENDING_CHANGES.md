# Pending Changes

## Title: Fix critical sync ID mismatch - displayed vs network

### Changes Made:
- Fixed syncServiceV2.create() to return existing sync info if already enabled (prevents generating new recovery phrase)
- Fixed syncServiceV2.enable() to return existing sync info without changing sync ID when already enabled  
- Changed DataModal to use syncService.create() instead of enable() for "Create New Sync" button
- This ensures displayed recovery phrase ALWAYS matches the one being used for network calls
- Root cause: enable() was generating new recovery phrases even when sync was already active

