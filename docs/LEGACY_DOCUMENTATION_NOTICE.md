# Legacy Documentation Notice

## Current Canonical Documentation
As of 2025-08-14, the authoritative data documentation is located in:
- `/docs/data/` directory - All current specs

### Primary References:
1. **`/docs/data/data-dictionary.md`** - Canonical field definitions
2. **`/docs/data/data-sync-service.md`** - Sync implementation
3. **`/docs/data/data-import-service.md`** - Import procedures
4. **`/docs/data/data-export-service.md`** - Export procedures
5. **`/docs/data/data-reset-service.md`** - Reset operations
6. **`/docs/data/data-overview.md`** - Architecture overview

## Legacy Documentation Files

The following files contain outdated field references and should be updated or consulted with caution:

### Files with Outdated Examples:
1. **`STACKMAP_COMPREHENSIVE_DOCUMENTATION.md`**
   - Uses `emoji` instead of `icon`
   - Uses `title` instead of `text`
   - Contains old activity model structure

2. **`docs/architecture/ARCHITECTURE_OVERVIEW.md`**
   - May have old field references
   - Check against current data-dictionary.md

3. **`archive/old-docs/`** directory
   - All files in this directory are legacy
   - Kept for historical reference only

### Files That Are Current:
- ✅ `DATA_FIELD_CONVENTIONS.md` - Aligns with new spec
- ✅ `development/DATA_FORMAT_SPEC.md` - Mostly current
- ✅ `SYNC_API_REFERENCE.md` - API structure still valid

## Field Name Changes

### Activities:
- **OLD**: `name`, `title` → **NEW**: `text`
- **OLD**: `emoji` → **NEW**: `icon`

### Users:
- **OLD**: `emoji` → **NEW**: `icon`

## ID Format Changes

### Current Format (as of 2025-08-14):
- Users: `user_${timestamp}_${index}_${randomId}`
- Activities: `activity_${deviceId}_${timestamp}_${randomId}`

### Legacy Formats:
- Users: `user_${timestamp}` or `user-${name}`
- Activities: `activity_${timestamp}` or custom IDs

## Important Notes
1. The normalization layer handles legacy fields automatically during import/sync
2. New code should ONLY use the field names defined in `/docs/data/data-dictionary.md`
3. When updating legacy code, replace old field names with new ones
4. The sync service normalizes all data before processing