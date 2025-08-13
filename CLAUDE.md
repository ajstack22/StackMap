# 🚨 DEPLOYMENT - ALWAYS USE THIS SCRIPT 🚨

## ⚠️ CRITICAL: ONLY ONE WAY TO DEPLOY ⚠️
**ALWAYS USE: `./scripts/deploy-all.sh`**
- This script AUTOMATICALLY increments version numbers
- Deploys to ALL platforms (iOS, Android, Web/Qual) 
- Keeps all build numbers synchronized
- NEVER manually build or deploy individual platforms
- NEVER manually increment version numbers
- NEVER use individual deploy scripts (deploy-web.sh, deploy-ios.sh, etc.)

**THE ONLY DEPLOYMENT COMMAND YOU SHOULD EVER RUN:**
```bash
./scripts/deploy-all.sh
```

**DO NOT:**
- ❌ Run `npm run build:web` manually
- ❌ Run `npx react-native run-ios` for production
- ❌ Run `./gradlew assembleRelease` manually
- ❌ Edit version in package.json manually
- ❌ Use any other deployment script

**This is the ONLY way. No exceptions. Ever.**

---

# 🚨 SYNC PERFORMANCE & VALIDATION FIXES - January 2025 🚨

## ✅ FIXED: 20+ Second UI Freeze on Sync Join ✅
**Problem:** App would freeze for 20+ seconds when joining sync, making it unresponsive
**Root Cause:** AsyncStorage.setItem was blocking the UI thread during Zustand state persistence
**Solution:** Added 1-second debounce to AsyncStorage writes in useAppStore.js

**Key Fix:**
```javascript
// useAppStore.js - Debounced storage adapter
const storage = {
  setItem: async (name, value) => {
    // Debounce writes by 1 second to prevent UI blocking
    clearTimeout(storageWriteTimer);
    storageWriteTimer = setTimeout(async () => {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    }, 1000);
  }
}
```

## ✅ FIXED: Sync Validation Errors ✅
**Problem:** "Conflict resolution failed validation" errors during sync
**Root Cause:** Missing users object in state during conflict resolution
**Solution:** Ensure users object always exists in conflictResolver and dataValidator

**Key Fixes:**
1. conflictResolver.js - Always ensure users object exists
2. dataValidator.js - Create default user if none exist
3. Better incremental sync validation for patches

**Important:** Sync blobs are tiny (~4KB) - performance issues are NOT from data size!

---

# 🚨 MOBILE SWIPE GESTURES - SOLVED 🚨

## ✅ ANDROID & iOS TABBED MODALS SWIPE FIX ✅
**Problem:** Swipe gestures between tabs only work on buttons, not on backgrounds/panels
**Solution:** Use `react-native-pager-view` for BOTH Android and iOS (NOT PanResponder!)

```javascript
// TabbedModal.js - THIS IS THE ONLY SOLUTION THAT WORKS ON MOBILE
import PagerView from 'react-native-pager-view';

{Platform.OS !== 'web' ? (
  <PagerView>  // Native ViewPager2 (Android) / UIPageViewController (iOS)
    {children}
  </PagerView>
) : (
  // PanResponder only for Web
)}
```

**Why PanResponder DOESN'T work on mobile with ScrollView:**
- ScrollView captures touches at the NATIVE level before JavaScript sees them
- Only TouchableOpacity bypasses this (has its own native touch handling)
- This affects BOTH Android AND iOS (as of iOS 18.5)
- No amount of PanResponder tweaking will fix this - it's a fundamental limitation

**DO NOT WASTE TIME TRYING:**
- ❌ pointerEvents="box-none" (doesn't work reliably)
- ❌ Overlay layers with z-index tricks
- ❌ Adjusting PanResponder thresholds
- ❌ GestureHandlerRootView (necessary but not sufficient)
- ❌ Capture phase handlers

**Just use react-native-pager-view for mobile platforms. Period.**

## ✅ SWIPE-TO-DISMISS vs SCROLL CONFLICT - FIXED (January 2025) ✅
**Problem:** Modal dismisses unintentionally when users scroll up from middle of content
**Root Cause:** Modal only tracked binary scroll state (scrolling/not), not actual scroll position
**Solution:** Track exact scroll position and only allow dismiss when ScrollView is at top (offset = 0)

**Key Fixes:**
```javascript
// TabbedModal.js - Track scroll position per tab
const scrollOffsetsRef = useRef({});
const isAtTopRef = useRef(true);

const updateScrollPosition = (tabKey, offset) => {
  scrollOffsetsRef.current[tabKey] = offset;
  const currentTabKey = tabs[activeTab]?.key;
  if (tabKey === currentTabKey) {
    isAtTopRef.current = offset <= 0;
  }
};

// Vertical PanResponder - NEVER capture upward swipes
onMoveShouldSetPanResponder: (evt, gestureState) => {
  // CRITICAL: Never capture upward swipes
  if (gestureState.dy < 0) {
    return false;
  }
  
  // Only capture downward swipes when at top
  const isDownwardSwipe = gestureState.dy > 10;
  const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
  const canDismiss = isAtTopRef.current && !isScrolling;
  
  return isDownwardSwipe && isVerticalGesture && canDismiss;
}
```

**Implementation:** TabContent automatically enhances ScrollView children with position tracking

---

# 🚨 MATERIAL ICONS WEB RENDERING FIX 🚨

## ✅ FIXED: Material Icons Not Showing on Web ✅
**Problem:** Material Icons display as empty spaces or broken on web
**Root Cause:** VectorIcons.web.js was using Typography Text component which forces Comic Relief font
**Solution:** Use plain HTML span element that preserves Material Icons font

**Key Fix:**
```javascript
// VectorIcons.web.js - DON'T use Typography component!
// ❌ BAD: import { Text } from '../components/Typography';
// ✅ GOOD: Use plain span with Material Icons font
return <span style={{fontFamily: 'Material Icons', ...}}>{icon}</span>
```

**This has happened multiple times - always check VectorIcons.web.js uses span, not Text!**

---

# 🚨 ACTIVE REFACTOR IN PROGRESS 🚨

## ⚠️ CRITICAL: Major Data Structure Refactor Planned ⚠️
**See [DATA_STRUCTURE_REFACTOR_PLAN.md](./DATA_STRUCTURE_REFACTOR_PLAN.md) for details**
- Pre-refactor checkpoint: commit `0691741`
- Activity Library bug: Shows 28 instead of 0 when empty
- Root cause: `activities` field used for templates, not user activities
- If continuing refactor, start with `/src/stores/useAppStore.js`

---

# 🚨 STACKMAP DEPLOYMENT - THE TRUTH 🚨

## 📚 Documentation Guide
- **[MD_FILES_INDEX.md](./MD_FILES_INDEX.md)** - Start here! Index of all documentation
- **[MD_FILES_AUDIT_REPORT.md](./MD_FILES_AUDIT_REPORT.md)** - Which docs to trust/ignore
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & solutions

## ✅ WHAT ACTUALLY WORKS ✅

### For Qual Deployment:
1. Build: `NODE_ENV=production npm run build:web`
2. Copy build files to root: `cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .`
3. Commit and push
4. Pull on server: `ssh stackmap-cpanel "cd ~/public_html/qual && git pull"`
5. Access at: https://stackmap.app/qual/

### For Production:
Use `./scripts/simple-deploy.sh` (it rsyncs from qual to prod)

## 📁 YES, FILES GO IN ROOT FOR QUAL
```
/public_html/qual/
├── index.html          # YES, in root
├── bundle.*.js         # YES, in root  
├── manifest.json       # YES, in root
├── service-worker.js   # YES, in root
├── fonts/              # YES, in root
├── icons/              # YES, in root
├── web/build/          # Source of truth, but we copy from here
└── src/                # Source code
```

## 🎯 THE FACTS
1. We DO copy build files to root for qual (despite what I said before)
2. This is what has always worked
3. Production uses simple-deploy.sh to rsync from qual
4. .cpanel.yml doesn't work on Namecheap - ignore it
5. No htaccess tricks needed - just files in root

## 🎨 DESIGN RULES
1. **NO GRAY TEXT** - All text must be black (#000) for accessibility
2. Theme backgrounds require high contrast - especially with light theme colors
3. StackMap serves neurodivergent users who need clear, high-contrast interfaces
4. Always test with all theme colors to ensure readability

## 🚨 iOS MODAL PANEL EXPANSION FIX 🚨

If panels in modals appear "too large" or "too big" on iOS, check these EXACT constraints:

```javascript
// REQUIRED iOS constraints in styles.js:
modalScrollView: { flex: 1 }
scrollContent: { ...(Platform.OS === 'ios' ? {} : { flexGrow: 1 }) }
sectionInner: { ...(Platform.OS === 'ios' && { flex: 0, flexGrow: 0, flexShrink: 1 }) }
activityCard: { ...(Platform.OS === 'ios' && { height: 32, maxHeight: 32 }) }
```

**NEVER:** Use inline styles, remove constraints, or add flexGrow on iOS!

## 🐛 COMMON ISSUES & FIXES

### Alert.alert Doesn't Work on Web
React Native's `Alert.alert` is not supported on web. Instead of using platform-specific code with `window.confirm()`, we use our custom `ConfirmModal` component for consistency across all platforms:

```javascript
// DON'T DO THIS:
if (Platform.OS === 'web') {
  const confirmed = window.confirm('Message');
  // ...
} else {
  Alert.alert('Title', 'Message', [...]);
}

// DO THIS INSTEAD:
import ConfirmModal from '../ConfirmModal';

// In component:
const [showConfirm, setShowConfirm] = useState(false);

// In JSX:
<ConfirmModal
  visible={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  theme={theme}
  title="Confirm Action"
  message="Are you sure?"
  confirmText="Confirm"
  confirmButtonColor="#e53e3e"
  icon="warning"
  iconColor="#e53e3e"
/>
```

**Where we use ConfirmModal:**
- Remove PIN button in Users & Security modal
- Delete user confirmation (should be updated)
- Delete category confirmation (should be updated)

## 📖 REACT BEST PRACTICES

### State Batching for Multiple Updates
When adding multiple items to state (e.g., "Add All" functionality), batch all updates into a single setState call:

```javascript
// ❌ BAD: Multiple setState calls in a loop
activities.forEach(activity => {
  setItems([...items, createNewItem(activity)]);
});
// Result: Only the last item is added due to React state batching

// ✅ GOOD: Batch all updates into one setState
const newItems = activities.map(activity => createNewItem(activity));
setItems([...items, ...newItems]);
// Result: All items are added correctly

// ✅ ALSO GOOD: Create separate handlers for batch operations
onSelectMultipleActivities={(activities) => {
  const newItems = activities.map((activity, index) => ({
    ...activity,
    id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    completed: false,
    pinned: false,
  }));
  setActivities([...currentActivities, ...newItems]);
}}
```

**Why this happens:** React batches state updates for performance. When setState is called multiple times synchronously, React may only apply the last update because each call uses the stale state value.

## 🔄 SYNC FUNCTIONALITY

### ✅ Sync is Working!
The zero-knowledge sync system is now fully functional with these features:
- **Sync URL sharing**: Share `stackmap.app/?sync=recovery_phrase` to invite others
- **Automatic sync preview**: URLs with sync parameter auto-fetch and preview data
- **Data validation**: Auto-repairs missing user fields (icon/emoji)
- **Streamlined onboarding**: Sync URLs skip welcome screen, go straight to preview
- **Local data clearing**: Existing data cleared before importing synced data

### Recovery Phrase Format
- **32 character hexadecimal** (no spaces, no special chars)
- Example: `a1b2c3d4e5f6789012345678901234567`
- URL-safe, no encoding needed

### Recent Sync Fixes (January 2025)
- Fixed API 404 errors (outdated server files)
- Fixed localStorage keys with "undefined" syncId
- Fixed theme undefined crashes in modals
- Fixed missing user icon validation errors
- Fixed duplicate sync preview modals
- Changed to panel-based modal design (no footer buttons)

## 🛑 CRITICAL: PREVENTING REGRESSION CYCLES 🛑

### Before Making ANY Changes:
1. **CHECK GIT HISTORY FIRST**: `git log -p --grep="<feature>" -- <file>` to see if it was already solved
2. **TEST ON ALL PLATFORMS**: Web, iOS (phone/tablet), Android (phone/tablet) 
3. **NEVER CHANGE SHARED CODE** without understanding ALL platform impacts
4. **DOCUMENT WHY**: Add comments explaining WHY code is written a certain way, not just what it does

### Platform Testing Matrix (MUST TEST ALL):
- [ ] Web Desktop (3 columns)
- [ ] Web Mobile (1 column)  
- [ ] iOS Phone (1 column portrait, 2 landscape)
- [ ] iOS Tablet/iPad (2 columns portrait, 3 landscape)
- [ ] Android Phone (1 column portrait, 2 landscape)
- [ ] Android Tablet (2 columns portrait, 3 landscape)

### Known Platform-Specific Solutions (DO NOT CHANGE):
1. **Android FlexWrap**: MUST use percentage widths (48%) + alignContent: 'flex-start'
2. **iOS Storage**: AsyncStorage causes 20+ second freeze - use default for now
3. **iOS Network**: NetInfo.fetch() DISABLED - causes freezes, just assumes online
4. **Mobile Swipe**: PagerView only, PanResponder doesn't work with ScrollView
5. **Typography**: Comic Relief forced everywhere via custom component

### Integration Points to NEVER Change Without Full Testing:
- `calculateCardWidth()` - affects ALL platform layouts
- `useAppStore` storage adapter - platform-specific implementations
- `networkMonitor.js` - disabled on iOS to prevent freezes
- Activity card width calculations - Android needs percentages
- ScrollView/PanResponder interactions - breaks on mobile

### When Bug Appears "Fixed":
1. STOP and test all 6 platform configurations
2. Check if you broke something that was previously working
3. Look for platform-specific code you may have removed
4. Review recent commits for unintended side effects

## Recent Changes (December 28, 2024)
- Fixed drag and drop by removing automatic sorting
- Added direct delete button to activity cards in edit mode
- Implemented toast notification system with undo
- Fixed PIN modal z-index issues
- Fixed Alert.alert not working on web for Remove PIN button
- Fixed "Add All" button only adding one activity due to React state batching
- Fixed card numbering gaps issue (cards starting at 5 instead of 1)
  - Added cleanupActivities() helper to filter out null/undefined/deleted items
  - Updated renderActivity to use filtered activities for proper indexing
  - Ensures card numbers always start at 1 and are sequential