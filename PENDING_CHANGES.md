# Pending Changes

## Title: Force sync ID consistency between storage and service

### Changes Made:
- Made getSyncId() async and always verify against AsyncStorage (source of truth)
- Made getRecoveryPhrase() always use sync ID from AsyncStorage
- Added validation to reject recovery phrases that generate wrong sync ID
- Will return null instead of wrong recovery phrase to prevent mismatch
- Service will auto-correct its sync ID if it differs from stored value
- This ensures displayed recovery phrase ALWAYS matches what's used in network calls

