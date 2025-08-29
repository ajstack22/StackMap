# CLAUDE.md - Essential StackMap Development Guide

## 🎯 CURRENT WORK - READ THIS FIRST!
**See `/CURRENT_WORK.md` for what we're actively building**
- Current Feature: Edit Mode List Refactor (converting cards to list view)
- NOT working on: Sync fixes, documentation cleanup, or old issues

## 🚀 DEPLOYMENT - ALWAYS USE THIS
```bash
# First, update PENDING_CHANGES.md with your changes:
# ## Title: Your descriptive title here
# ### Changes Made:
# - List of changes...

./scripts/qual_deploy.sh  # Deploys to QUAL/staging with auto version increment + tests
./scripts/prod_deploy.sh all  # Full production deploy (web + Android AAB + iOS prep)
./scripts/prod_deploy.sh web  # Deploy web to production only
```
**Commit Messages:** Update `PENDING_CHANGES.md` before deploying for descriptive commit messages
**For all deployment details:** See `docs/deployment/README.md`
**Testing approach:** See `docs/testing/simple-testing-guide.md`

---

## 📁 CRITICAL PROJECT STRUCTURE

### Key Directories
- `/docs/` - **PRIMARY DOCUMENTATION LOCATION**
  - `deployment/` - Deployment procedures and guides
  - `sync/` - Sync system documentation and troubleshooting
  - `platform/` - Platform-specific guides (iOS, Android, Web)
  - `features/` - Feature implementation guides and specifications
  - `testing/` - Testing guides, checklists, and protocols
  - `onboarding/` - New developer guides and user onboarding docs
- `/scripts/` - All automation scripts
- `/src/components/EditModeList/` - New unified edit mode (Jan 2025)
- `/src/utils/dataNormalizer.js` - Field normalization logic

### Branch Strategy (Jan 13, 2025)
- `main` - Source code only (no build files)
- `deploy-qual` - Qual build artifacts
- `deploy-prod` - Production build artifacts

---

## ⚠️ PLATFORM-SPECIFIC GOTCHAS (DO NOT CHANGE)

### Android
- **FlexWrap Cards**: MUST use percentage widths (48%) + alignContent: 'flex-start'
- **No calculateCardWidth()** for multi-column layouts
- **Font Weights**: MUST use font variants (ComicRelief-Bold) without fontWeight property
  - Typography component handles this automatically - just use `fontWeight: 'bold'`

### iOS  
- **AsyncStorage**: Causes 20+ second freeze - debounced in useAppStore.js
- **NetInfo.fetch()**: DISABLED - causes freezes, assumes online
- **Modal constraints**: Must use specific flex rules (see styles.js)

### Web
- **VectorIcons.web.js**: MUST use `<span>` not `<Text>` component
- **Alert.alert**: Not supported - use ConfirmModal component
- **Build files**: Go in ROOT for qual, not web/build/

### Mobile (iOS & Android)
- **Swipe in modals**: Use `react-native-pager-view` NOT PanResponder
- **ScrollView**: Captures touches at native level before JS

---

## 🎨 DESIGN RULES
1. **NO GRAY TEXT** - All text must be black (#000) for accessibility
2. **High contrast** required - test with all theme colors
3. **Typography**: Comic Relief font forced everywhere via custom component
   - iOS/Web: Uses fontWeight with "Comic Relief" font
   - Android: Uses font variants (ComicRelief-Bold/Regular) without fontWeight

## ⚠️ FIELD NAMING STANDARDS (CRITICAL)
- **Activities**: Use `text` (not name/title), `icon` (not emoji)
- **Users**: Use `icon` (not emoji), `name` as string only
- **Always include fallbacks**: `activity.text || activity.name || activity.title`
- **Normalizer**: `/src/utils/dataNormalizer.js` handles variations
- **See**: `/docs/features/field-conventions.md` for full details

---

## 🔄 SYNC SYSTEM (Reverted to Complex - v2025.08.18)
- **Strategy**: Last-write-wins with conflict resolution
- **Architecture**: Full service with queue, throttling, network monitoring  
- **Components**: syncService.js + 9 supporting modules (queue, network, etc.)
- **URL Format**: `stackmap.app/?sync=<32-char-hex>`
- **Recovery phrase**: 32 character hexadecimal (no spaces)
- **Periodic Sync**: 30-second interval when enabled
- **Sync Triggers**: App visibility, data changes (5s debounce), manual, periodic
- **Offline Support**: Queue system for offline changes
- **Note**: Reverted from simplified TypeScript version due to AsyncStorage issues
- **Debug**: Check `[Sync]` and sync status messages in console

### Data Flow Summary
**Push**: Stores → Normalize (text/icon) → Encrypt (NaCl with 100k iterations) → Server (zero-knowledge)  
**Pull**: Server → Decrypt → Validate → Resolve conflicts → Update stores  
**Key Fields**: Activities use `text` (not name/title) and `icon` (not emoji)  
**Sync ID**: First 16 bytes of NaCl hash (100k iterations) of recovery phrase + fixed salt
**See**: `/docs/sync/README.md` for complete technical details

---

## 🛠️ ACTIVE DEVELOPMENT

### Store Refactoring (COMPLETED Aug 15, 2025)
- ✅ Split monolithic store into 4 focused stores
- ⚠️ **CRITICAL:** Always use store-specific methods for updates (not `useAppStore.setState`)
  - User updates: `useUserStore.getState().setUsers()`
  - Settings: `useSettingsStore.getState().updateSettings()`
  - Library: `useLibraryStore.getState().setLibrary()`
- See `/docs/STORE_ARCHITECTURE.md` for new structure and completion details

### TypeScript Migration (Jan 2025 - In Progress)
- Gradual migration strategy with @ts-check
- Type checking integrated into deployment
- See `/docs/TYPESCRIPT_ANALYSIS.md` for current status
- Run `npm run typecheck` before committing

### Edit Mode Refactor (Jan 2025)
- Unified list-based interface across all platforms
- Button-based reordering (no drag & drop)
- Max width constraints for readability
- Simplified animations (200ms fades) for better iOS performance
- See `/docs/features/edit-mode-refactor.md` for full specs

### Data Structure (COMPLETED Jan 2025)
- See `/docs/DATA_STRUCTURE.md` for complete documentation
- Migration completed: commit `[current]`
- Pre-migration checkpoint: commit `0691741`

---

## 🐛 QUICK FIXES

### "My Templates category not found"
Initialize EMPTY_CATEGORIES with default category in ActivityLibrary.js

### Bundle not found on web
Files must be copied to root directory, not served from web/build/

### "User missing icon or emoji" during sync
- Icons must be preserved during conflict resolution
- Always use store-specific update methods (not `useAppStore.setState`)
- See fix in syncService.ts `getCurrentState()` and `restoreData()`

### iOS build fails
```bash
cd ios && pod install
```

### Android build fails
```bash
cd android && ./gradlew clean
```

---

## 📝 BEFORE ANY CHANGES
1. Check `/docs/` directory for existing documentation
2. Check git history: `git log -p --grep="<feature>"`
3. Test on ALL platforms if changing shared code
4. Document WHY, not just what

---

## 🔗 QUICK LINKS
- [New Developer Guide](./docs/onboarding/new-developer-guide.md)
- [Full Deployment Guide](./docs/deployment/README.md)
- [Feature Documentation](./docs/features/README.md)
- [Testing Guides](./docs/testing/README.md)
- [Field Conventions](./docs/features/field-conventions.md)
- [Edit Mode Specs](./docs/features/edit-mode-refactor.md)
- [Troubleshooting](./TROUBLESHOOTING.md)