# StackMap - Critical Information for Claude

## 🚨 DEPLOYMENT - SIMPLE SYSTEM 🚨

```bash
./scripts/simple-deploy.sh deploy    # Deploy qual to production
./scripts/simple-deploy.sh rollback  # Rollback if issues occur
```

See `/docs/DEPLOYMENT.md` for details.

---

## 📚 Critical Architecture Documentation

### Must-Read Files
1. **`/context/css-module-map.md`** - CSS module organization (DO NOT create new CSS files)
2. **`/context/drawer-architecture.md`** - Drawer handle/extension relationship
3. **`/context/z-index-map.md`** - Stacking context and layering
4. **`/context/javascript-components.md`** - JS component interactions
5. **`/context/completion-tracking-update.md`** - Simplified completion system

### Key Architectural Rules
- 14 existing CSS modules cover all styling needs - DO NOT create new CSS files
- All UI elements must have 44px+ touch targets
- Search for impacts before making changes
- Test on mobile viewport

## Current System State

### Z-Index Stack (highest to lowest)
1. 1010 - Floating buttons
2. 1005 - Drawer handle
3. 1004 - Preferences panel
4. 1003 - Native dropdowns
5. 1002 - Drawer extension
6. 1001 - Header wrapper
7. 999 - Drawer backdrop
8. 1 - Main content

### Component Relationships
```
StackMapApp.js
├── initializeDrawer() - Main drawer logic
├── PreferencesManager.js - Settings panel
└── State.js - Data management
    └── localStorage persistence
```

## Testing & Validation

### Commands
```bash
npm test                          # Run all tests
./scripts/pre-deploy-check.sh     # Pre-deployment validation
./scripts/check-links.sh          # Verify all links
```

### Browser Console Commands
```javascript
runUAT()                // Run UAT tests
debugUsers()            // Debug user system
adjustDrawerHandle()    // Test drawer positioning
```

### Critical Test Learnings
- Use `.card` not `.activity-card` for selectors
- Wait 1000ms for FAB close animations
- Use `window.appInstance` not `window.app`
- Enter 'A' to bypass validation modals

## Deployment Process

```
Local → GitHub → Qual → Production
```

1. Push to GitHub
2. Deploy to qual: `./scripts/deploy-to-qual.sh`
3. Test at https://stackmap.app/qual/
4. Deploy to prod: `./scripts/deploy-qual-to-prod.sh`

### URLs
- **Qual**: https://stackmap.app/qual/
- **Production**: https://stackmap.app/

### NEVER DO
- ❌ Deploy directly to production without qual testing
- ❌ Create new deployment methods
- ❌ Remove console.log statements (breaks code)

## Recent Important Changes

### Completion Tracking (Dec 2024)
- Each activity has simple `completed` boolean
- Today and Tomorrow have separate activity IDs
- Use `deepCloneActivities()` to prevent shared references

### Native Dropdowns
- Position: 2px right from trigger
- Z-index: 1003
- Platform-specific width calculations
- See `showNativeDropdown()` in StackMapApp.js:717-875

### Link Verification
- Run `./scripts/check-links.sh` before deployment
- Validates all menu handlers and page links

## Quick Reference

### Documentation Locations
- Architecture: `/context/` directory
- Testing: `/docs/UAT_TESTING_GUIDE.md`
- Deployment: `/docs/DEPLOYMENT.md`
- CSS modules: `/context/css-module-map.md`

### Common Issues & Solutions
- **FAB won't close**: Wait 1000ms for animation
- **Cards not found**: Use `.card` selector
- **Validation modal loop**: Call `ensureCleanState()`
- **Transform stacking**: Check z-index-map.md

---

*For Claude-to-Claude collaboration examples and detailed implementation notes, see `/archive/CLAUDE.md.backup-20250621`*