# Pending Changes

## Title: Make recovery phrases visually distinct from sync IDs

### Changes Made:
- Changed recovery phrase format to use dashes (XXXX-XXXX-XXXX-XXXX...) for readability
- Recovery phrases now visually distinct from sync IDs (which remain plain hex)
- Added backward compatibility to parse both old (plain hex) and new (dashed) formats
- Added temporary hardcoded fix for known mismatched sync
- Removed debug text from DataModal sync tab

