# Pending Changes

## Title: Fix sync persistence on app refresh

### Changes Made:
- Re-initialize encryption when loading existing sync on app start
- Perform initial sync pull on app load to get latest data
- Fix isEnabled() to check for both sync enabled AND syncId exists
- Clear syncId if recovery phrase is missing (can't decrypt without it)

