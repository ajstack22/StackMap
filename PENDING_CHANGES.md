# Pending Changes

## Title: Fix sync ID generation consistency in joinWithInviteCode

### Changes Made:
- Fixed inconsistent sync ID generation in joinWithInviteCode method
- Now uses the standard generateSyncId() method for consistent sync ID calculation
- This fixes the "Recovery phrase does not match this sync group" error when joining via invite code

