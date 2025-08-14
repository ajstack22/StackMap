# CLAUDE.md - Essential StackMap Development Guide

## 🚀 DEPLOYMENT - ALWAYS USE THIS
```bash
./scripts/deploy-all.sh  # Deploys to ALL platforms with auto version increment
```
**For all deployment details:** See `prompts/deployment.md`

---

## 📁 CRITICAL PROJECT STRUCTURE

### Key Directories
- `/prompts/` - **CHECK FIRST** for all documentation
  - `deployment.md` - Complete deployment guide
  - `editmoderefactor/` - Edit mode implementation specs
- `/scripts/` - All automation scripts
- `/src/components/EditModeList/` - New unified edit mode (Jan 2025)

### Branch Strategy (Jan 13, 2025)
- `main` - Source code only (no build files)
- `deploy-qual` - Qual build artifacts
- `deploy-prod` - Production build artifacts

---

## ⚠️ PLATFORM-SPECIFIC GOTCHAS (DO NOT CHANGE)

### Android
- **FlexWrap Cards**: MUST use percentage widths (48%) + alignContent: 'flex-start'
- **No calculateCardWidth()** for multi-column layouts

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

---

## 🔄 SYNC SYSTEM
- **URL Format**: `stackmap.app/?sync=<32-char-hex>`
- **Recovery phrase**: 32 character hexadecimal (no spaces)
- **Validation**: Auto-repairs missing user fields
- **Performance**: Sync blobs are tiny (~4KB)

---

## 🛠️ ACTIVE DEVELOPMENT

### Edit Mode Refactor (Jan 2025)
- Unified list-based interface across all platforms
- Button-based reordering (no drag & drop)
- Max width constraints for readability
- See `/prompts/editmoderefactor/` for full specs

### Data Structure Refactor (PLANNED)
- See `DATA_STRUCTURE_REFACTOR_PLAN.md`
- Pre-refactor checkpoint: commit `0691741`

---

## 🐛 QUICK FIXES

### "My Templates category not found"
Initialize EMPTY_CATEGORIES with default category in ActivityLibrary.js

### Bundle not found on web
Files must be copied to root directory, not served from web/build/

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
1. Check `/prompts/` directory for existing documentation
2. Check git history: `git log -p --grep="<feature>"`
3. Test on ALL platforms if changing shared code
4. Document WHY, not just what

---

## 🔗 QUICK LINKS
- [Full Deployment Guide](./prompts/deployment.md)
- [Edit Mode Specs](./prompts/editmoderefactor/)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [MD Files Index](./MD_FILES_INDEX.md)