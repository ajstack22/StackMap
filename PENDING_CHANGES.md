# Pending Changes

## Title: Try Multiple Sync Records to Handle Corrupted Data

### Changes Made:
- Modified minimalSyncService to try up to 3 recent records if decryption fails
- This handles cases where the latest sync record is corrupted from the UTF-8 bug
- Will try records in reverse chronological order until one succeeds
- Logs which record timestamp was successfully decrypted
- This ensures sync works even if some records are corrupted

