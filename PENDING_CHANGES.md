# Pending Changes

## Title: Fix sync ID mismatch by linking recovery phrase and sync ID generation

### Changes Made:
- Fixed critical sync ID mismatch by generating both recovery phrase AND sync ID together in create()
- Modified create() to generate sync ID once and pass it to enable() via this.syncId
- Updated enable() to skip sync ID generation if this.syncId is already set
- Ensures displayed recovery phrase and network sync ID always match because they're calculated together

