# Pending Changes

## Title: Fix Sync ID Generation and 404 Error on Join

### Changes Made:
- Fixed critical sync ID generation bug where joining existing sync groups failed with 404
- Updated syncStoreIntegration.js to auto-create sync group if it doesn't exist (lines 505-525)
- Ensured all platforms use consistent nacl.hash algorithm for sync ID generation
- Added automatic fallback: if joining fails with 404, creates new sync with same recovery phrase
- Updated documentation to correctly describe the nacl.hash implementation (not PBKDF2)
- Maintains full backward compatibility with existing sync groups

