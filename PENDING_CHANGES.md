# Pending Changes

## Title: Fix Server Protection - Track Devices on Pull

### Changes Made:
- Fixed critical bug: devices weren't being tracked when they pulled
- pull.php now creates device record on first pull (tracks join time)
- push.php blocks ALL devices without record (new devices)
- Extended protection window to 60 seconds (was too close at 30)
- This ensures Device B cannot push immediately after joining

