# Pending Changes

## Title: Fix sync import double modal and data deletion

### Changes Made:
- Fixed duplicate sync modal appearing after import completes
- Clear syncSetupPhrase state after successful import
- Remove sync parameter from URL to prevent reload issues
- Prevent the useEffect from triggering a second import modal
- This fixes the issue where data gets deleted after successful import

