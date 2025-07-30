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