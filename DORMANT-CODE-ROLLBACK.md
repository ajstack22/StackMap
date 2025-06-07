# Dormant Code Rollback Instructions
Generated: 2025-01-06

## Quick Rollback Commands

If you need to quickly rollback all dormant code changes, run these commands:

```bash
# 1. Restore test file imports in index.html
# Search for "DORMANT-2025-01-06: Test files" and uncomment the script tags

# 2. Remove dormant markers from files
find . -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.json" -o -name "*.py" | \
xargs grep -l "DORMANT-2025-01-06" | \
while read file; do
    echo "Processing $file"
    # Remove dormant comment lines
    sed -i.bak '/DORMANT-2025-01-06/d' "$file"
done

# 3. Restore blog system (if needed)
# Remove the DORMANT comment from the first line of:
# - blog.html
# - blog/blog-data.js
# - blog/blog-renderer.js
# - blog/blog-styles.css
```

## Manual Rollback Steps

### 1. Restore Test File Imports
Edit `/Users/adamstack/StackMap/StackMap/index.html` line 235-247:
- Remove the comment markers around the test script tags
- Change from:
  ```html
  <!-- DORMANT-2025-01-06: Test files not needed in production
  <script src="test-suite.js"></script>
  ...
  -->
  ```
- To:
  ```html
  <!-- Load test suite -->
  <script src="test-suite.js"></script>
  ...
  ```

### 2. Restore Files with Dormant Markers

Files marked with dormant comments:
- **Blog System**: blog.html, blog/*.js, blog/*.css
- **Test Files**: All test-*.js and test-*.html files
- **Config Files**: mobile-ui-fixes.json, preferences-update-config.json
- **Scripts**: update.py

To restore each file:
1. Open the file
2. Remove the line containing "DORMANT-2025-01-06"
3. Save the file

### 3. Files That Can Be Safely Deleted After 7 Days

Once confirmed these are not needed:
- All test-*.js files (15 files)
- All test-*.html files (6 files)
- Blog directory and files
- mobile-ui-fixes.json
- preferences-update-config.json
- update.py
- Backup files in /backups/

## Verification Steps

After rollback or before deletion:
1. Run the app and check all functionality works
2. Test PWA features (service worker may be needed)
3. Check if privacy/terms pages are linked from app stores
4. Verify no build/deployment scripts depend on removed files

## Safety Notes

- All changes are reversible
- Original functionality preserved
- No data loss occurs
- Comments clearly mark all changes with "DORMANT-2025-01-06"