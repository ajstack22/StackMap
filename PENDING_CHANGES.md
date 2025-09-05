# Pending Changes

## Title: Fix timezone inconsistency in sync invite validation

### Changes Made:
- Fixed timezone issue in validate_invite.php by using gmdate() instead of date()/NOW()
- Updated create_invite.php to use UTC timestamps consistently
- Modified use_invite.php to use UTC for expiration checks
- All invite timestamps now use UTC to prevent timezone mismatch errors

