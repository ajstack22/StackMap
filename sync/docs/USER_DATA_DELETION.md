# User-Controlled Data Deletion

## Overview

StackMap Sync provides users with complete control over their data, including the ability to permanently delete all sync data from the server.

## Deletion Options

### 1. **Disable Sync Locally**
- **What it does**: Stops syncing on the current device only
- **Server data**: Remains intact on the server
- **Other devices**: Continue syncing normally
- **Use when**: You want to stop syncing on one device but keep using sync on others

### 2. **Delete from Server**
- **What it does**: Permanently removes ALL sync data from the server
- **Server data**: Completely deleted, including:
  - Encrypted data blob
  - Device registrations
  - Sync metadata
  - Associated metrics
- **Other devices**: Will lose access to synced data
- **Use when**: You want to completely remove your data from our servers

## How to Delete Your Data

1. Enter Edit Mode
2. Open Settings (requires PIN if set)
3. Scroll to "Cross-Device Sync" section
4. Click "Delete from Server" (red button)
5. Confirm twice (for safety)

## What Happens When You Delete

### Immediate Effects:
- ✅ All encrypted data removed from server
- ✅ All device registrations deleted
- ✅ Sync group permanently removed
- ✅ Recovery phrase becomes invalid
- ✅ Other devices can't sync anymore

### Local Effects:
- ✅ Your local data remains untouched
- ✅ You can continue using StackMap normally
- ✅ You can enable a new sync later if desired

## Security Features

### Authentication Required:
- Must have valid `sync_id` and `device_id`
- Only devices in the sync group can delete it
- Rate limited to prevent abuse (5 attempts per hour)

### Double Confirmation:
- First prompt explains consequences
- Second prompt requires explicit confirmation
- No accidental deletions

## Privacy Guarantee

When you delete your data:
- **Complete removal**: No backups or archives retained
- **Immediate effect**: Deletion happens instantly
- **No recovery**: We cannot restore deleted data
- **Anonymous metrics**: Only anonymous event logged (no personal data)

## Re-enabling Sync After Deletion

If you delete your sync data, you can still:
1. Create a new sync group (new recovery phrase)
2. Your local data will become the initial sync state
3. Other devices would need the new recovery phrase

## Technical Details

The deletion process:
1. Verifies device authorization
2. Begins database transaction
3. Logs anonymous metrics
4. Deletes from `sync_data` table
5. CASCADE deletes from:
   - `sync_devices`
   - Any active pairing sessions
6. Commits transaction
7. Returns confirmation

## Comparison with Automatic Cleanup

| Feature | User Deletion | Automatic Cleanup |
|---------|--------------|-------------------|
| Trigger | User action | 6 months inactive |
| Confirmation | Required (2x) | None needed |
| Timing | Immediate | Daily at 3 AM |
| Reversible | No | No |
| Local data | Preserved | N/A (already gone) |

## FAQ

**Q: Can I undo a deletion?**
A: No, deletions are permanent and cannot be undone.

**Q: Will this affect my local data?**
A: No, only server data is deleted. Your local StackMap data remains.

**Q: Can other devices in my sync group delete the data?**
A: Yes, any device in the sync group can delete the shared data.

**Q: What if I just want to leave the sync group?**
A: Use "Disable Sync Locally" instead - this only affects your device.

**Q: Is the deletion logged?**
A: Only anonymous metrics are logged (event type, device count, timestamp). No personal data is retained.