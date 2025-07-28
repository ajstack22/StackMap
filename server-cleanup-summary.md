# Server Cleanup Summary

## What was done:

1. **Created a backup** of the entire public_html directory before making any changes
   - Backup location: `~/stackmap-backup-[timestamp].tar.gz`

2. **Cleaned up public_html** to contain only production files:
   - Removed all development files (source code, build scripts, documentation)
   - Removed old/unused bundle files
   - Kept only the files necessary for running StackMap

3. **Copied files from qual to production root**
   - All necessary web files are now in the root public_html directory
   - StackMap is now accessible from your main domain

## Final Structure:

```
public_html/
├── *.png                    # Activity images (10 files)
├── api/                     # Sync API folder
├── bundle.*.js              # Main JavaScript bundle
├── bundle.*.js.LICENSE.txt  # License file
├── fonts/                   # Web fonts
├── .htaccess               # Server configuration
├── icons/                  # App icons
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── manylla/                # Manylla app (preserved)
├── qual/                   # Qual environment (preserved)
├── service-worker.js       # Service worker for PWA
├── .well-known/            # Server verification files
└── workbox-*.js            # Service worker library
```

## Access URLs:
- Production: https://stackmap.app/
- Qual: https://stackmap.app/qual/
- Manylla: https://stackmap.app/manylla/

## Notes:
- Total size reduced from ~1GB to ~334MB
- All unnecessary development files removed
- Both qual and manylla folders preserved as requested
- API sync functionality preserved