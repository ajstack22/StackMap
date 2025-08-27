# Pending Changes

## Title: Enhanced sync debugging to track recovery phrase mismatch

### Changes Made:
- Added verification in getRecoveryPhrase() to check if stored phrase generates correct sync ID
- Added logging when storing recovery phrases to track what's being saved
- Will now detect and report if wrong recovery phrase is stored for a sync ID

