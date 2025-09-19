# StackMap New Developer Onboarding Guide

## 🚨 CRITICAL: Read This First

### Recently Changed (As of Aug 18, 2025)
1. ⚠️ **Sync service reverted to complex** - Simplified TypeScript version had AsyncStorage issues
2. ✅ **React Native Web Vector Icons** - Fixed to use `Text` component, not `span`
3. ✅ **AsyncStorage on web** - Working with localStorage wrapper at `src/utils/AsyncStorage.web.js`
4. 🔄 **Sync is now JavaScript** - Converted from TypeScript due to promise hanging issues

---

## 📁 Essential Documentation

### Must-Read Files (in order):
1. `/CLAUDE.md` - Critical project conventions and gotchas
2. `/docs/deployment/README.md` - Complete deployment guide
3. `/docs/features/field-conventions.md` - CRITICAL field naming standards
4. `/docs/DATA_STRUCTURE.md` - Complete data model documentation
5. `/docs/STORE_ARCHITECTURE.md` - Zustand store structure
6. `/docs/sync/troubleshooting.md` - Sync system debugging

### Quick Reference Structure:
```
/docs/              # Primary documentation location
  onboarding/       # New developer guides
  features/         # Feature implementation guides
  testing/          # Testing guides and protocols
  deployment/       # Deployment procedures
  sync/             # Sync system documentation
  
/scripts/           # All automation scripts
  qual_deploy.sh or prod_deploy.sh     # Main deployment script
  
/src/
  components/       # React Native components
  services/sync/    # Sync system (TypeScript)
  stores/           # Zustand stores (split architecture)
  utils/            # Utilities including web polyfills
```

---

## 🔥 Critical Gotchas

### Platform-Specific Issues

#### Web Platform
```javascript
// ❌ WRONG - Causes React Error 130
return <span>{iconContent}</span>;

// ✅ CORRECT - Must use React Native components
const Text = require('react-native').Text;
return <Text>{iconContent}</Text>;
```

#### Android
- **FlexWrap Cards**: MUST use percentage widths (48%) + alignContent: 'flex-start'
- **No calculateCardWidth()** for multi-column layouts

#### iOS
- **AsyncStorage**: Causes 20+ second freeze - debounced in useAppStore.js
- **NetInfo.fetch()**: DISABLED - causes freezes, assumes online

---

## 🔄 Sync System Architecture (Reverted to Complex - Aug 18, 2025)

### Current State
- **Strategy**: Last-write-wins with conflict resolution
- **Architecture**: Full service with queue, throttling, network monitoring
- **Sync Triggers**: App visibility, data changes (5s debounce), manual, periodic (30s)
- **Periodic Sync**: Re-enabled 30-second timer
- **Network Monitoring**: Full monitoring with offline queue
- **Conflict Resolution**: Complex merge with field-level resolution

### Key Files:
- `/src/services/sync/syncService.js` - Main sync service (JavaScript, ~2600 lines)
- `/src/services/sync/conflictResolver.js` - Complex conflict resolution
- `/src/services/sync/syncQueue.js` - Offline queue management
- `/src/services/sync/networkMonitor.js` - Network status tracking
- `/src/services/sync/changeTracker.js` - Incremental sync support
- `/src/services/sync/encryptionService.js` - Zero-knowledge encryption

### Debug Sync Issues:
```javascript
// Check sync status in console
localStorage.getItem('@sync_enabled')  // Should be 'true'
localStorage.getItem('@sync_id')       // 32-char hex string
localStorage.getItem('@recovery_phrase_[syncId]')  // Encrypted phrase

// Force sync in console
syncService.sync()  // Direct sync (no queue)
```

---

## 📦 Data Structure

### Activity Fields (CRITICAL)
```javascript
// ✅ CORRECT field names
{
  id: 'activity_123',
  text: 'Activity Name',      // NOT name or title
  icon: '🎯',                 // NOT emoji
  completed: false,
  completedAt: 1234567890,
  order: 0
}
```

### User Fields
```javascript
{
  id: 'user_123',
  name: 'User Name',          // String only
  icon: '👤',                 // NOT emoji
  days: {
    today: { activities: [] },
    tomorrow: { activities: [] }
  }
}
```

### Store Updates (CRITICAL)
```javascript
// ❌ WRONG - Doesn't trigger proper updates
useAppStore.setState({ users });

// ✅ CORRECT - Use store-specific methods
useUserStore.getState().setUsers(users);
useSettingsStore.getState().updateSettings(settings);
useLibraryStore.getState().setLibrary(library);
```

---

## 🚀 Development Workflow

### Starting Development
```bash
# Web development
npm run web              # Runs on port 5503

# iOS development
cd ios && pod install
npm run ios

# Android development
cd android && ./gradlew clean
npm run android
```

### Before Committing
```bash
npm run typecheck       # TypeScript validation
npm run lint           # ESLint checks
```

### Deployment
```bash
# Deploy to all platforms with tests
./scripts/qual_deploy.sh or prod_deploy.sh

# Emergency deploy without tests
./scripts/qual_deploy.sh or prod_deploy.sh --skip-tests
```

---

## 🐛 Common Issues & Solutions

### "Sync not working"
1. Check localStorage has sync credentials
2. Verify sync service is initialized: `syncService.initialized`
3. Check network status: `networkMonitor.isOnline`
4. Look for `[Sync]` logs in console

### "Activities show target emoji"
- Check field is `icon` not `emoji`
- Verify normalization in `/src/utils/dataNormalizer.js`

### "Bundle not found on web"
- Files must be in root for qual, not `web/build/`

### "React Error 130"
- Component returning DOM element instead of React Native element
- Check VectorIcons.web.js uses `Text` not `span`

---

## 🔑 Key Design Principles

1. **NO GRAY TEXT** - All text must be black (#000) for accessibility
2. **High contrast required** - Test with all theme colors
3. **Comic Relief font** - Forced everywhere via custom component
4. **Mobile-first** - Web is secondary platform
5. **Zero-knowledge sync** - All data encrypted client-side

---

## 📝 Testing

### Manual Testing Checklist
- [ ] Test on all platforms (iOS, Android, Web)
- [ ] Test sync between 2+ devices
- [ ] Test with different theme colors
- [ ] Test edit mode on all platforms
- [ ] Test offline/online transitions

### Automated Tests
```bash
npm test                # Run Jest tests
./scripts/test-sync-fast.sh  # Quick sync test
```

---

## 🆘 Getting Help

1. Check `/docs/` directory first
2. Search git history: `git log -p --grep="<feature>"`
3. Check `/TROUBLESHOOTING.md`
4. Look for similar issues in `/docs/sync/troubleshooting.md`

---

## 🚫 Never Do These

1. **NEVER** update git config
2. **NEVER** create files unless absolutely necessary
3. **NEVER** use `setState` on wrapper stores
4. **NEVER** add gray text (accessibility)
5. **NEVER** use `emoji` field for activities (use `icon`)
6. **NEVER** return DOM elements in React Native components
7. **NEVER** commit without running typecheck

---

## Architecture Decisions

### Why Complex Sync?
- Simple last-write-wins caused conflicts
- Queue system handles offline scenarios
- Field-level conflict resolution prevents data loss
- Network monitoring ensures reliability

### Why Split Stores?
- Better performance (selective re-renders)
- Clearer data ownership
- Easier debugging
- TypeScript compatibility

### Why Zero-Knowledge?
- Privacy by design
- No server-side decryption possible
- Recovery phrase is the only key
- Compliant with privacy regulations

---

## Contact & Resources

- **Documentation**: `/docs/` directory
- **Deployment Guide**: `/docs/deployment/README.md`
- **Data Conventions**: `/docs/features/field-conventions.md`
- **Troubleshooting**: `/TROUBLESHOOTING.md`
- **Architecture**: `/docs/STORE_ARCHITECTURE.md`