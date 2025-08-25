# Pending Changes

## Title: Fix stale data bug, add timestamps, and update documentation

### Changes Made:
- Fixed EditModeList onUpdate handler to merge fresh store data with reordered array
- Added proper null handling for missing modifiedAt timestamps (defaults to 0)
- Added modifiedAt: 0 to all activities in demo-data-kids.json
- Updated sync troubleshooting guide with v2025.08.25 fixes
- Added conflict resolution section to sync README
- Updated field conventions with timestamp documentation
- Added stale props issue to main troubleshooting guide

