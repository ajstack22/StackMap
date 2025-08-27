# Pending Changes

## Title: Add Visible Debug Info for Sync Issue Diagnosis

### Changes Made:
- Added visible debug info in DataModal showing sync flags (v19)
- Added debug alert when Browser B joins sync to confirm flags are set
- Debug info shows: JJ (justJoined), AR (applyingRemote), SE (syncEnabled) flags
- This helps diagnose why protection mechanisms aren't preventing data loss

